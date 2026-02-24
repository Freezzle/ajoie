package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailAttachment;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.InputStreamSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmailInvoiceReminderHandler implements EmailActionHandler<InvoicingPlan>, ActionMetadataProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailInvoiceReminderHandler.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final EmailCreator emailCreator;
    private final DownloadInvoiceHandler downloadInvoiceHandler;
    private final EventLogService eventLogService;
    private final InvoicingPlanRepository repository;
    private final TransactionalTenantOperation transactionalOps;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Autowired
    @Lazy
    private EmailInvoiceReminderHandler self;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }

        if (payload.getState() == State.ISSUED) {
            boolean isEmail = payload.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL;
            boolean isExpired = Instant.now().isAfter(payload.getExpirationDate());

            return ActionSupport.fromConditions("action.invoice-reminder.help",
                ConditionalKey.of(isEmail, "action.invoice-reminder.condition.email-method"),
                ConditionalKey.of(isExpired, "action.invoice-reminder.condition.is-expired")
            );
        }

        return ActionSupport.rejected();
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
        self.prepareAndSendInTenant(payload.getId(), context, payload.getTenantId());
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void prepareAndSendInTenant(UUID idPlan, Map<String, Object> context, UUID tenantId) {
        TenantContextHolder.runAsTenant(tenantId, () -> {
            transactionalOps.execute(() -> {
                InvoicingPlan payload = this.repository.getReferenceById(idPlan);
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
            });
        });
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_REMINDER;
    }
}
