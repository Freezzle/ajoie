package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.State;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.document.Recipient;
import ch.salon.service.document.Sender;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DownloadReceiptHandler implements DocumentActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final MessageSource messageSource;
    private final DocumentCreator documentCreator;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState().isNotDraft() && payload.getState() != State.CANCELLED) {
            return ActionSupport.allowed("action.receipt-download.help");
        }
        return ActionSupport.rejected();
    }

    @Override
    public InputStreamSource download(InvoicingPlan payload, Map<String, Object> context) throws IOException {
        Recipient recipient = new Recipient(payload.getParticipation().getExhibitor());
        recipient.setEnterpriseName(payload.getParticipation().getTherapistName());
        Sender sender = new Sender(payload.getParticipation().getSalon()); // FIXME + logo

        Context thymeleafCtxt = new Context(recipient.getLanguage());
        /* HEADER */
        thymeleafCtxt.setVariable("headerTitle",
                this.messageSource.getMessage("document.invoice-receipt.header", null, Locale.FRENCH));
        thymeleafCtxt.setVariable("recipient", recipient);
        thymeleafCtxt.setVariable("sender", sender);

        /* TEMPLATE */
        thymeleafCtxt.setVariable("reference", payload.getBillingNumber());
        thymeleafCtxt.setVariable("sentDate", DateUtils.instantToIso(Instant.now()));
        thymeleafCtxt.setVariable("invoiceDate", DateUtils.instantToIso(payload.getIssuedDate()));

        thymeleafCtxt.setVariable("contact", "Claude Pascal / Claude Charlène / Claude Dylan");
        thymeleafCtxt.setVariable("phone", "+41797686084 / +41768395523 / +41799647875");

        thymeleafCtxt.setVariable("invoices", payload.getInvoices());
        thymeleafCtxt.setVariable("payments", payload.getPayments());
        thymeleafCtxt.setVariable("hasPaidSomething", !payload.getPayments().isEmpty());
        thymeleafCtxt.setVariable("total", payload.getTotal());

        thymeleafCtxt.setVariable("iban", "CH07 8080 8002 0290 1493 8");

        return this.documentCreator.build("invoice-receipt", thymeleafCtxt);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.RECEIPT_DOWNLOAD;
    }

    @Override
    public String getFilename(InvoicingPlan payload, Map<String, Object> context) {
        return "Receipt_" + payload.getBillingNumber() + ".pdf";
    }
}
