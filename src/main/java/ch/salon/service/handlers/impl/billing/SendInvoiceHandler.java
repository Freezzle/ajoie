package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.DateUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.InputStreamSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
public class SendInvoiceHandler implements EmailActionHandler<InvoicingPlan> {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final EmailCreator emailCreator;
    private final DownloadInvoiceHandler downloadInvoiceHandler;
    private final EventLogService eventLogService;
    private final InvoicingPlanRepository repository;

    @Autowired
    @Lazy
    private SendInvoiceHandler self;

    private static final Logger LOGGER = LoggerFactory.getLogger(SendInvoiceHandler.class);

    public SendInvoiceHandler(EmailCreator emailCreator, DownloadInvoiceHandler downloadInvoiceHandler,
            InvoicingPlanRepository repository,
            EventLogService eventLogService) {
        this.emailCreator = emailCreator;
        this.downloadInvoiceHandler = downloadInvoiceHandler;
        this.eventLogService = eventLogService;
        this.repository = repository;
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
        State oldState = payload.getState();
        payload.setIssuedDate(Instant.now());
        payload.setExpirationDate(InvoicingPlan.calculateExpirationDate(payload));
        payload.setState(State.IS_ISSUING);

        self.prepareAndSend(payload.getId(), oldState, context);
    }

    @Async
    @Transactional
    public void prepareAndSend(UUID idPlan, State oldState, Map<String, Object> context) {
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
            LOGGER.error("Problem during sending email", e);
            plan.setIssuedDate(null);
            plan.setExpirationDate(null);
            plan.setState(oldState);
            eventLogService.eventFromSystem("Problème d'envoi facture", EventType.EMAIL, EntityType.INVOICE_PLAN, plan.getId(),
                    null);
            eventLogService.eventFromSystem("Problème d'envoi facture " + plan.getBillingNumber(), EventType.EMAIL,
                    EntityType.PARTICIPATION, plan.getParticipation().getId(), null);
        }
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_SEND;
    }
}
