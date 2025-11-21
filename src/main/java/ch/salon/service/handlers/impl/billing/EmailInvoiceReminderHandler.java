package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailAttachment;
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
import org.springframework.core.io.InputStreamSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class EmailInvoiceReminderHandler implements EmailActionHandler<InvoicingPlan> {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailInvoiceReminderHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final EmailCreator emailCreator;
    private final DownloadInvoiceHandler downloadInvoiceHandler;
    private final EventLogService eventLogService;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Autowired
    @Lazy
    private EmailInvoiceReminderHandler self;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload == null) {
            return SupportType.REJECTED;
        }

        if (payload.getState() == State.ISSUED && payload.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL) {
            if (Instant.now().isAfter(payload.getExpirationDate())) {
                return SupportType.ALLOWED;
            } else {
                return SupportType.DISABLED;
            }
        }

        return SupportType.REJECTED;
    }

    @Override
    public EmailMessage buildTemplate(InvoicingPlan payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);
        String subject = this.emailCreator.getTranslatedText("email.invoice-reminder.title", locale,
                payload.getParticipation().getSalon().getPlace());

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(payload.getParticipation().getExhibitor().getEmail());
        emailMessage.setSubject(subject);
        emailMessage.setAttachments(List.of(new EmailAttachment(downloadInvoiceHandler.getFilename(payload, null),
                ContextActionType.INVOICE_DOWNLOAD.code(), payload.getId())));

        Context thymeleafCtxt = new Context(locale);
        thymeleafCtxt.setVariable("startDate",
                DateUtils.instantToIso(payload.getParticipation().getSalon().getStartingDate()));
        thymeleafCtxt.setVariable("endDate",
                DateUtils.instantToIso(payload.getParticipation().getSalon().getEndingDate()));
        emailMessage.setBody(this.emailCreator.getContentHtml("billing/invoice-reminder", thymeleafCtxt));

        return emailMessage;
    }

    @Override
    public void handle(InvoicingPlan payload, Map<String, Object> context) throws Exception {
        self.prepareAndSend(payload, context);
    }

    @Async
    @Transactional
    public void prepareAndSend(InvoicingPlan payload, Map<String, Object> context) {
        Object raw = context.get("emailMessage");
        EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
        if (emailMessage == null) {
            emailMessage = buildTemplate(payload, context);
        }

        try {
            InputStreamSource attachment = this.downloadInvoiceHandler.download(payload, context);
            emailCreator.send(emailMessage, Map.of(this.downloadInvoiceHandler.getFilename(payload, context), attachment));
            eventLogService.eventFromSystem("Rappel envoyée", EventType.EMAIL, EntityType.INVOICE_PLAN, payload.getId(),
                    null);
            eventLogService.eventFromSystem("Rappel renvoyée " + payload.getBillingNumber(), EventType.EMAIL,
                    EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
        } catch (Exception e) {
            LOGGER.error("Problem during sending email : invoice-reminder.html", e);
            eventLogService.eventFromSystem("Problème d'envoi de rappel", EventType.EMAIL, EntityType.INVOICE_PLAN,
                    payload.getId(), null);
            eventLogService.eventFromSystem("Problème d'envoi de rappel " + payload.getBillingNumber(), EventType.EMAIL,
                    EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
        }
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_REMINDER;
    }
}
