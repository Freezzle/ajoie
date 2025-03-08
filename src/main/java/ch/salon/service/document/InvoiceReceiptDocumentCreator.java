package ch.salon.service.document;

import ch.salon.domain.InvoicingPlan;
import ch.salon.utils.DateUtils;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.util.Locale;

@Component
public class InvoiceReceiptDocumentCreator implements IDocumentCreatorContract {

    private final MessageSource messageSource;
    private final DocumentCreator documentCreator;
    private InvoicingPlan invoicingPlan;

    public InvoiceReceiptDocumentCreator(DocumentCreator documentCreator, MessageSource messageSource) {
        this.documentCreator = documentCreator;
        this.messageSource = messageSource;
    }

    public void fillInvoicingPlan(InvoicingPlan invoicingPlan) {
        this.invoicingPlan = invoicingPlan;
    }


    @Override
    public InputStreamSource generate() throws Exception {
        return this.documentCreator.generate(this);
    }

    @Override
    public String getTemplateName() {
        return "invoice-receipt";
    }

    @Override
    public Context getContext() {
        Context context = new Context(Locale.FRENCH);

        Recipient recipient = new Recipient(invoicingPlan.getParticipation().getExhibitor());
        recipient.setEnterpriseName(invoicingPlan.getParticipation().getTherapistName());
        Sender sender = new Sender(invoicingPlan.getParticipation().getSalon()); // FIXME + logo

        /* HEADER */
        context.setVariable("headerTitle",
                            this.messageSource.getMessage("document.invoice-receipt.header", null, Locale.FRENCH));
        context.setVariable("recipient", recipient);
        context.setVariable("sender", sender);

        /* TEMPLATE */
        context.setVariable("reference", invoicingPlan.getBillingNumber());
        context.setVariable("sentDate", DateUtils.instantToIso(Instant.now()));
        context.setVariable("invoiceDate", DateUtils.instantToIso(invoicingPlan.getIssuedDate()));

        context.setVariable("contact", "Claude Pascal / Grillon Nathalie");
        context.setVariable("phone", "+41 79 768 60 84 / +41 79 690 18 71");

        context.setVariable("invoices", invoicingPlan.getInvoices());
        context.setVariable("payments", invoicingPlan.getPayments());
        context.setVariable("hasPaidSomething", !invoicingPlan.getPayments().isEmpty());
        context.setVariable("total", invoicingPlan.getTotal());

        context.setVariable("iban", "CH07 8080 8002 0290 1493 8");

        return context;
    }
}
