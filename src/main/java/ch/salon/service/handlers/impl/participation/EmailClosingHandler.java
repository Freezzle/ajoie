package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ParticipationRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
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
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmailClosingHandler implements EmailActionHandler<Participation> {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailClosingHandler.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;
    private final ParticipationRepository repository;
    private final TransactionalTenantOperation transactionalOps;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Autowired
    @Lazy
    private EmailClosingHandler self;

    @Override
    public SupportType supports(Participation payload, Map<String, Object> context) {
        return payload != null && payload.getStatus() == Status.CLOSED ? SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public EmailMessage buildTemplate(Participation payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);

        String subject = this.emailCreator.getTranslatedText("email.participation-closed.title", locale,
                payload.getSalon().getPlace());

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(payload.getExhibitor().getEmail());
        emailMessage.setSubject(subject);

        Context thymeleafCtxt = new Context(locale);
        thymeleafCtxt.setVariable("salon", payload.getSalon().getPlace());
        thymeleafCtxt.setVariable("startDate", DateUtils.instantToIso(payload.getSalon().getStartingDate()));
        thymeleafCtxt.setVariable("endDate", DateUtils.instantToIso(payload.getSalon().getEndingDate()));
        emailMessage.setBody(this.emailCreator.getContentHtml("participation/closed", thymeleafCtxt));

        return emailMessage;
    }

    @Override
    public void handle(Participation payload, Map<String, Object> context) throws Exception {
        self.prepareAndSendInTenant(payload.getId(), context, payload.getTenantId());
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void prepareAndSendInTenant(UUID idParticipation, Map<String, Object> context, UUID tenantId) throws Exception {
        TenantContextHolder.runAsTenant(tenantId, () -> {
            transactionalOps.execute(() -> {
                Participation payload = repository.getReferenceById(idParticipation);
                Object raw = context.get("emailMessage");
                EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
                if (emailMessage == null) {
                    emailMessage = buildTemplate(payload, context);
                }

                try {
                    emailCreator.send(emailMessage, null);
                    eventLogService.eventFromSystem("Email de clôture envoyé", EventType.EMAIL, EntityType.PARTICIPATION,
                            payload.getId(), null);
                } catch (Exception e) {
                    LOGGER.error("Problem during sending email : closed.html", e);
                    eventLogService.eventFromSystem("Problème d'envoi : closed.html", EventType.EMAIL, EntityType.PARTICIPATION,
                            payload.getId(), null);
                }
            });
        });
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_CLOSING_EMAIL;
    }
}
