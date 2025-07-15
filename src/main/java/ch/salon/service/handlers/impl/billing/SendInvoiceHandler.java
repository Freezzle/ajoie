package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;

@Component
public class SendInvoiceHandler implements EmailActionHandler<InvoicingPlan> {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmailCreator emailCreator;
    private final DownloadInvoiceHandler downloadInvoiceHandler;
    private final EventLogService eventLogService;

    public SendInvoiceHandler(EmailCreator emailCreator, DownloadInvoiceHandler downloadInvoiceHandler,
            EventLogService eventLogService) {
        this.emailCreator = emailCreator;
        this.downloadInvoiceHandler = downloadInvoiceHandler;
        this.eventLogService = eventLogService;
    }

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null && payload.getState().isDraft() && payload.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL ?
                SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public EmailMessage buildTemplate(InvoicingPlan payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);

        String subject = this.emailCreator.getTranslatedText("email.invoice.title", locale,
                payload.getParticipation().getSalon().getPlace());

        Context thymeleafCtxt = new Context(locale);
        thymeleafCtxt.setVariable("salon", payload.getParticipation().getSalon().getPlace());
        thymeleafCtxt.setVariable("arrangement", payload.getNeedArrangement());
        thymeleafCtxt.setVariable("startDate",
                DateUtils.instantToIso(payload.getParticipation().getSalon().getStartingDate()));
        thymeleafCtxt.setVariable("endDate",
                DateUtils.instantToIso(payload.getParticipation().getSalon().getEndingDate()));

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom("dylan.claude.work@gmail.com");
        emailMessage.setTo(payload.getParticipation().getExhibitor().getEmail());
        emailMessage.setSubject(subject);
        emailMessage.setBody(this.emailCreator.getContentHtml("invoiceEmail", thymeleafCtxt));

        return emailMessage;
    }

    @Override
    public void handle(InvoicingPlan payload, Map<String, Object> context) throws Exception {
        payload.setIssuedDate(Instant.now());
        payload.setExpirationDate(InvoicingPlan.calculateExpirationDate(payload));
        payload.setState(State.ISSUED);

        Object raw = context.get("emailMessage");
        EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
        if (emailMessage == null) {
            emailMessage = buildTemplate(payload, context);
        }

        InputStreamSource attachment = this.downloadInvoiceHandler.download(payload, context);
        emailCreator.send(emailMessage, Map.of(this.downloadInvoiceHandler.getFilename(payload, context), attachment));
        eventLogService.eventFromSystem("Facture envoyée", EventType.EMAIL, EntityType.INVOICE_PLAN, payload.getId(),
                null);
        eventLogService.eventFromSystem("Facture envoyée " + payload.getBillingNumber(), EventType.EMAIL,
                EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_SEND;
    }
}
