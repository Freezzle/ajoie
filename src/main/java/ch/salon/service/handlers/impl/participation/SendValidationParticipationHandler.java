package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;

@Component
public class SendValidationParticipationHandler implements EmailActionHandler<Participation> {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;

    public SendValidationParticipationHandler(EmailCreator emailCreator, EventLogService eventLogService) {
        this.emailCreator = emailCreator;
        this.eventLogService = eventLogService;
    }

    @Override
    public SupportType supports(Participation payload, Map<String, Object> context) {
        return payload != null && !payload.getNeedArrangement() && payload.getStatus() == Status.VALIDATED ?
                SupportType.ALLOWED : SupportType.REJECTED;
    }


    @Override
    public EmailMessage buildTemplate(Participation payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);

        String subject = this.emailCreator.getTranslatedText("email.participation-validated.title", locale,
                payload.getSalon().getPlace());

        Context thymeleafCtxt = new Context(locale);
        thymeleafCtxt.setVariable("salon", payload.getSalon().getPlace());
        thymeleafCtxt.setVariable("startDate", DateUtils.instantToIso(payload.getSalon().getStartingDate()));
        thymeleafCtxt.setVariable("endDate", DateUtils.instantToIso(payload.getSalon().getEndingDate()));

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom("dylan.claude.work@gmail.com");
        emailMessage.setTo(payload.getExhibitor().getEmail());
        emailMessage.setSubject(subject);
        emailMessage.setBody(this.emailCreator.getContentHtml("participationValidatedEmail", thymeleafCtxt));

        return emailMessage;
    }

    @Override
    public void handle(Participation payload, Map<String, Object> context) throws Exception {
        Object raw = context.get("emailMessage");
        EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
        if (emailMessage == null) {
            emailMessage = buildTemplate(payload, context);
        }

        emailCreator.send(emailMessage, null);

        eventLogService.eventFromSystem("Email participation validée envoyé", EventType.EMAIL, EntityType.PARTICIPATION,
                payload.getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_VALIDATION_SEND;
    }
}
