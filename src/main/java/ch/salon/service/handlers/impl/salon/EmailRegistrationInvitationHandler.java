package ch.salon.service.handlers.impl.salon;

import ch.salon.domain.Salon;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
import ch.salon.utils.SalonProperties;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Envoi groupé d'une invitation à s'inscrire au salon, à destination de tous les clients
 * de l'annuaire inscrits à la newsletter, non bloqués et pas déjà inscrits à ce salon.
 * <p>
 * Les destinataires sont systématiquement recalculés côté serveur et placés en copie cachée,
 * par lots de {@value #BATCH_SIZE} adresses maximum.
 */
@Component
@RequiredArgsConstructor
public class EmailRegistrationInvitationHandler implements EmailActionHandler<Salon>, ActionMetadataProvider {

    public static final int BATCH_SIZE = 50;

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailRegistrationInvitationHandler.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;
    private final ExhibitorRepository exhibitorRepository;
    private final ParticipationRepository participationRepository;
    private final SalonRepository repository;
    private final SalonProperties salonProperties;
    private final TransactionalTenantOperation transactionalOps;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Autowired
    @Lazy
    private EmailRegistrationInvitationHandler self;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }

        return ActionSupport.fromConditions("action.salon-registration-invitation-email.help",
                ConditionalKey.of(payload.isRegistrationEnabled(),
                        "action.salon-registration-invitation-email.condition.registration-enabled"));
    }

    @Override
    public EmailMessage buildTemplate(Salon payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo("");
        emailMessage.setSubject(
                this.emailCreator.getTranslatedText("email.salon-registration-invitation.title", locale,
                        payload.getPlace()));
        emailMessage.setRecipientsCount(findRecipients(payload.getId()).size());

        Context thymeleafCtxt = new Context(locale);
        thymeleafCtxt.setVariable("salon", payload.getPlace());
        thymeleafCtxt.setVariable("startDate", DateUtils.instantToIso(payload.getStartingDate()));
        thymeleafCtxt.setVariable("endDate", DateUtils.instantToIso(payload.getEndingDate()));
        thymeleafCtxt.setVariable("closingDate", DateUtils.instantToIso(payload.getRegistrationClosingDate()));
        thymeleafCtxt.setVariable("registrationLink", buildRegistrationLink(payload.getId()));
        emailMessage.setBody(this.emailCreator.getContentHtml("salon/registration-invitation", thymeleafCtxt));

        return emailMessage;
    }

    @Override
    public void handle(Salon payload, Map<String, Object> context) throws Exception {
        self.prepareAndSendInTenant(payload.getId(), context, payload.getTenantId());
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void prepareAndSendInTenant(UUID idSalon, Map<String, Object> context, UUID tenantId) {
        TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.execute(() -> {
            Salon payload = this.repository.getReferenceById(idSalon);

            Object raw = context.get("emailMessage");
            EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
            if (emailMessage == null) {
                emailMessage = buildTemplate(payload, context);
            }

            // Les destinataires ne proviennent jamais du client : ils sont recalculés ici.
            List<String> recipients = findRecipients(payload.getId());
            if (recipients.isEmpty()) {
                eventLogService.eventFromSystem("Invitation à s'inscrire : aucun destinataire", EventType.EMAIL,
                        EntityType.SALON, payload.getId(), null);
                return;
            }

            int sent = 0;
            int batches = 0;
            for (int start = 0; start < recipients.size(); start += BATCH_SIZE) {
                List<String> batch = recipients.subList(start, Math.min(start + BATCH_SIZE, recipients.size()));
                batches++;

                EmailMessage batchMessage = new EmailMessage();
                batchMessage.setFrom(StringUtils.defaultIfBlank(emailMessage.getFrom(), senderEmail));
                batchMessage.setTo("");
                batchMessage.setBcc(new ArrayList<>(batch));
                batchMessage.setSubject(emailMessage.getSubject());
                batchMessage.setBody(emailMessage.getBody());

                try {
                    emailCreator.send(batchMessage, null);
                    sent += batch.size();
                } catch (Exception e) {
                    LOGGER.error("Problem during sending registration invitation email (batch {})", batches, e);
                    eventLogService.eventFromSystem(
                            "Problème d'envoi de l'invitation à s'inscrire (lot " + batches + ")", EventType.EMAIL,
                            EntityType.SALON, payload.getId(), null);
                }
            }

            eventLogService.eventFromSystem(
                    "Invitation à s'inscrire envoyée à " + sent + " destinataire(s) en " + batches + " lot(s)",
                    EventType.EMAIL, EntityType.SALON, payload.getId(), null);
        }));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.SALON_REGISTRATION_INVITATION_EMAIL;
    }

    private String buildRegistrationLink(UUID salonId) {
        String baseUrl = StringUtils.removeEnd(StringUtils.defaultString(salonProperties.getMail().getBaseUrl()), "/");
        return baseUrl + "/inscription/" + salonId;
    }

    /**
     * Clients de l'annuaire inscrits à la newsletter et non bloqués, dédoublonnés,
     * en excluant ceux déjà inscrits (participation non annulée / non refusée) à ce salon.
     */
    private List<String> findRecipients(UUID idSalon) {
        Set<String> alreadyRegistered = participationRepository
                .findExhibitorEmailsBySalonId(idSalon)
                .stream()
                .map(StringUtils::trimToNull)
                .filter(StringUtils::isNotBlank)
                .map(email -> email.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        return new ArrayList<>(exhibitorRepository.findAllByNewsletterIsTrueAndRedFlagIsFalse().stream()
                                                  .map(exhibitor -> StringUtils.trimToNull(exhibitor.getEmail()))
                                                  .filter(StringUtils::isNotBlank)
                                                  .map(email -> email.toLowerCase(Locale.ROOT))
                                                  .filter(email -> !alreadyRegistered.contains(email))
                                                  .collect(Collectors.toCollection(LinkedHashSet::new)));
    }
}
