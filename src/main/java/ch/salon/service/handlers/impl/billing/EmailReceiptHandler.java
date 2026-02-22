package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailAttachment;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.mail.EmailCreator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class EmailReceiptHandler implements EmailActionHandler<InvoicingPlan>, ActionMetadataProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailReceiptHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final EmailCreator emailCreator;
    private final DownloadReceiptHandler downloadReceiptHandler;
    private final EventLogService eventLogService;
    private final InvoicingPlanRepository repository;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState() == State.PAID) {
            return ActionSupport.allowed();
        }
        return ActionSupport.rejected();
    }

    @Override
    public EmailMessage buildTemplate(InvoicingPlan payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);
        String subject = this.emailCreator.getTranslatedText("email.invoice-receipt.title", locale,
                payload.getParticipation().getSalon().getPlace());

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(payload.getParticipation().getExhibitor().getEmail());
        emailMessage.setSubject(subject);
        Context thymeleafCtxt = new Context(locale);
        emailMessage.setBody(this.emailCreator.getContentHtml("billing/receipt-content", thymeleafCtxt));
        emailMessage.setAttachments(List.of(new EmailAttachment(downloadReceiptHandler.getFilename(payload, null), ContextActionType.RECEIPT_DOWNLOAD.code(), payload.getId())));

        return emailMessage;
    }

    @Override
    public void handle(InvoicingPlan payload, Map<String, Object> context) throws Exception {
        TenantContextHolder.runAsTenant(payload.getTenantId(), () -> {
            InvoicingPlan invoice = this.repository.getReferenceById(payload.getId());
            Object raw = context.get("emailMessage");
            EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
            if (emailMessage == null) {
                emailMessage = buildTemplate(invoice, context);
            }

            try {
                InputStreamSource attachment = this.downloadReceiptHandler.download(invoice, context);
                emailCreator.send(emailMessage, Map.of(this.downloadReceiptHandler.getFilename(invoice, context), attachment));

                eventLogService.eventFromSystem("Quittance envoyée", EventType.EMAIL, EntityType.INVOICE_PLAN, invoice.getId(),
                        null);
                eventLogService.eventFromSystem("Quittance envoyée " + invoice.getBillingNumber(), EventType.EMAIL,
                        EntityType.PARTICIPATION, invoice.getParticipation().getId(), null);
            } catch (Exception e) {
                LOGGER.error("Problem during sending email : invoice-reminder.html", e);
                eventLogService.eventFromSystem("Problème d'envoi de quittance", EventType.EMAIL, EntityType.INVOICE_PLAN,
                        payload.getId(), null);
                eventLogService.eventFromSystem("Problème d'envoi de quittance " + payload.getBillingNumber(), EventType.EMAIL,
                        EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
            }
        });
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.RECEIPT_SEND;
    }
}
