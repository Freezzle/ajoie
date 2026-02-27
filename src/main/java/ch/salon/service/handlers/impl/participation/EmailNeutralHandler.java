package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.ParticipationRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.mail.EmailCreator;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmailNeutralHandler implements EmailActionHandler<Participation>, ActionMetadataProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailNeutralHandler.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;
    private final ParticipationRepository repository;
    private final TransactionalTenantOperation transactionalOps;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Autowired
    @Lazy
    private EmailNeutralHandler self;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload != null) {
            return ActionSupport.allowed("action.participation-neutral-email.help");
        }
        return ActionSupport.rejected();
    }

    @Override
    public EmailMessage buildTemplate(Participation payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);

        String subject = this.emailCreator.getTranslatedText("email.participation-neutral.title", locale,
                payload.getSalon().getPlace());

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(payload.getExhibitor().getEmail());
        emailMessage.setSubject(subject);
        emailMessage.setBody("");

        return emailMessage;
    }

    @Override
    public void handle(Participation payload, Map<String, Object> context) throws Exception {
        self.prepareAndSendInTenant(payload.getId(), context, payload.getTenantId());
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void prepareAndSendInTenant(UUID idParticipation, Map<String, Object> context, UUID tenantId) {
        TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.execute(() -> {
                Participation payload = this.repository.getReferenceById(idParticipation);
                Object raw = context.get("emailMessage");

                EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
                if (emailMessage == null) {
                    emailMessage = buildTemplate(payload, context);
                }

                try {
                    emailCreator.send(emailMessage, null);

                    String label = StringUtils.hasText(emailMessage.getSubject())
                        ? emailMessage.getSubject() : "(sans objet)";

                    eventLogService.eventFromSystem("Email libre envoyé : " + label, EventType.EMAIL, EntityType.PARTICIPATION,
                            payload.getId(), null);
                } catch (Exception e) {
                    String errorLabel = StringUtils.hasText(emailMessage.getSubject())
                        ? "Problème d'envoi : " + emailMessage.getSubject()
                        : "Problème d'envoi email";

                    LOGGER.error("Problem during sending neutral email", e);
                    eventLogService.eventFromSystem(errorLabel, EventType.EMAIL,
                            EntityType.PARTICIPATION, payload.getId(), null);
                }
            }));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_NEUTRAL_EMAIL;
    }
}
