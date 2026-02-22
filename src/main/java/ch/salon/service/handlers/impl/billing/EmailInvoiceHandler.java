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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmailInvoiceHandler implements EmailActionHandler<InvoicingPlan>, ActionMetadataProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(EmailInvoiceHandler.class);
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
    private EmailInvoiceHandler self;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState().isDraft() &&
                payload.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL) {
            return ActionSupport.allowed();
        }
        return ActionSupport.rejected();
    }

    @Override
    public EmailMessage buildTemplate(InvoicingPlan payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);
        String subject = this.emailCreator.getTranslatedText("email.invoice.title", locale,
                payload.getParticipation().getSalon().getPlace());

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(payload.getParticipation().getExhibitor().getEmail());
        emailMessage.setSubject(subject);
        emailMessage.setAttachments(List.of(new EmailAttachment(downloadInvoiceHandler.getFilename(payload, null),
                ContextActionType.INVOICE_DOWNLOAD.code(), payload.getId())));

        String contentToLoad = "billing/invoice";
        if (payload.getNeedArrangement()) {
            contentToLoad = "billing/invoice-arrangement";
        }

        Context thymeleafCtxt = new Context(locale);
        thymeleafCtxt.setVariable("startDate",
                DateUtils.instantToIso(payload.getParticipation().getSalon().getStartingDate()));
        thymeleafCtxt.setVariable("endDate",
                DateUtils.instantToIso(payload.getParticipation().getSalon().getEndingDate()));
        emailMessage.setBody(this.emailCreator.getContentHtml(contentToLoad, thymeleafCtxt));

        return emailMessage;
    }

    @Override
    public void handle(InvoicingPlan payload, Map<String, Object> context) throws Exception {
        State oldState = payload.getState();
        payload.setIssuedDate(Instant.now());
        payload.setExpirationDate(InvoicingPlan.calculateExpirationDate(payload));
        payload.setState(State.IS_ISSUING);

        self.prepareAndSendInTenant(payload.getId(), oldState, context, payload.getTenantId());
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void prepareAndSendInTenant(UUID idPlan, State oldState, Map<String, Object> context, UUID tenantId) {
        TenantContextHolder.runAsTenant(tenantId, () -> {
            transactionalOps.execute(() -> {
                InvoicingPlan plan = this.repository.getReferenceById(idPlan);
                Object raw = context.get("emailMessage");
                EmailMessage emailMessage = objectMapper.convertValue(raw, EmailMessage.class);
                if (emailMessage == null) {
                    emailMessage = buildTemplate(plan, context);
                }

                try {
                    InputStreamSource attachment = this.downloadInvoiceHandler.download(plan, context);
                    emailCreator.send(emailMessage, Map.of(this.downloadInvoiceHandler.getFilename(plan, context), attachment));
                    plan.setIssuedDate(Instant.now());
                    plan.setExpirationDate(InvoicingPlan.calculateExpirationDate(plan));
                    plan.setState(State.ISSUED);
                    eventLogService.eventFromSystem("Facture envoyée", EventType.EMAIL, EntityType.INVOICE_PLAN, plan.getId(),
                            null);
                    eventLogService.eventFromSystem("Facture envoyée " + plan.getBillingNumber(), EventType.EMAIL,
                            EntityType.PARTICIPATION, plan.getParticipation().getId(), null);
                } catch (Exception e) {
                    LOGGER.error("Problem during sending email : invoice.html", e);
                    plan.setIssuedDate(null);
                    plan.setExpirationDate(null);
                    plan.setState(oldState);
                    eventLogService.eventFromSystem("Problème d'envoi facture", EventType.EMAIL, EntityType.INVOICE_PLAN,
                            plan.getId(), null);
                    eventLogService.eventFromSystem("Problème d'envoi facture " + plan.getBillingNumber(), EventType.EMAIL,
                            EntityType.PARTICIPATION, plan.getParticipation().getId(), null);
                }
            });
        });
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_SEND;
    }
}
