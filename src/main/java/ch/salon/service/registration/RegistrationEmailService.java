package ch.salon.service.registration;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.ParticipationRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
import ch.salon.utils.SalonProperties;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Envoi de l'accusé de réception d'une inscription publique, avec le lien de modification.
 */
@Service
@RequiredArgsConstructor
public class RegistrationEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RegistrationEmailService.class);

    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;
    private final ParticipationRepository participationRepository;
    private final TransactionalTenantOperation transactionalOps;
    private final SalonProperties salonProperties;
    private final RegistrationSummaryDocument registrationSummaryDocument;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    /**
     * Construit le lien public permettant à l'exposant de modifier son inscription.
     */
    public String buildEditLink(UUID salonId, UUID participationId, String token) {
        String baseUrl = StringUtils.removeEnd(StringUtils.defaultString(salonProperties.getMail().getBaseUrl()), "/");
        return baseUrl + "/inscription/" + salonId + "/modification/" + participationId + "/" + token;
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void sendRegistrationReceived(UUID tenantId, UUID participationId, UUID salonId, String token) {
        send(tenantId, participationId, salonId, token, "participation/received",
                "email.participation-received.title", "received.html");
    }

    /**
     * Accusé de réception d'une modification d'inscription : l'exposant reçoit un récapitulatif à jour.
     */
    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void sendRegistrationUpdated(UUID tenantId, UUID participationId, UUID salonId, String token) {
        send(tenantId, participationId, salonId, token, "participation/updated",
                "email.participation-updated.title", "updated.html");
    }

    private void send(UUID tenantId, UUID participationId, UUID salonId, String token, String template,
            String subjectKey, String logName) {
        TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.execute(() -> {
            Participation participation = participationRepository.findById(participationId).orElse(null);
            if (participation == null) {
                LOGGER.warn("Participation {} not found, no acknowledgement email sent", participationId);
                return;
            }

            Locale locale = resolveLocale(participation);

            try {
                EmailMessage emailMessage = new EmailMessage();
                emailMessage.setFrom(senderEmail);
                emailMessage.setTo(participation.getExhibitor().getEmail());
                emailMessage.setSubject(
                        emailCreator.getTranslatedText(subjectKey, locale, participation.getSalon().getPlace()));

                Context context = new Context(locale);
                context.setVariable("firstName", participation.getExhibitor().getFirstName());
                context.setVariable("salon", participation.getSalon().getPlace());
                context.setVariable("startDate", DateUtils.instantToIso(participation.getSalon().getStartingDate()));
                context.setVariable("endDate", DateUtils.instantToIso(participation.getSalon().getEndingDate()));
                context.setVariable("editLink", buildEditLink(salonId, participationId, token));
                emailMessage.setBody(emailCreator.getContentHtml(template, context));

                emailCreator.send(emailMessage, buildSummaryAttachment(participation, locale));

                eventLogService.eventFromSystem("Accusé de réception d'inscription envoyé", EventType.EMAIL,
                        EntityType.PARTICIPATION, participationId, null);
            } catch (Exception e) {
                LOGGER.error("Problem during sending email : {}", logName, e);
                eventLogService.eventFromSystem("Problème d'envoi : " + logName, EventType.EMAIL,
                        EntityType.PARTICIPATION, participationId, null);
            }
        }));
    }

    /**
     * Récapitulatif PDF joint à l'email. Un échec de génération ne doit jamais empêcher l'envoi de
     * l'accusé de réception : on se contente alors de le journaliser.
     */
    private Map<String, InputStreamSource> buildSummaryAttachment(Participation participation, Locale locale) {
        try {
            return Map.of(registrationSummaryDocument.getFilename(participation),
                    registrationSummaryDocument.build(participation, locale));
        } catch (Exception e) {
            LOGGER.error("Unable to build the registration summary PDF for participation {}", participation.getId(), e);
            eventLogService.eventFromSystem("Récapitulatif PDF non généré", EventType.EMAIL,
                    EntityType.PARTICIPATION, participation.getId(), null);
            return null;
        }
    }

    private Locale resolveLocale(Participation participation) {
        String language = participation.getExhibitor() != null ? participation.getExhibitor().getLanguage() : null;
        return StringUtils.isBlank(language) ? Locale.FRENCH : Locale.forLanguageTag(language);
    }
}
