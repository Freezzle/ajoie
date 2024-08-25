package ch.salon.service.document;

import ch.salon.domain.InvoicingPlan;
import java.time.LocalDate;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Component
public class InvoiceDocumentCreator extends AbstractDocumentCreator {

    private MessageSource messageSource;
    private InvoicingPlan invoicingPlan;

    public InvoiceDocumentCreator(
        @Qualifier("documentTemplateEngine") SpringTemplateEngine documentTemplateEngine,
        MessageSource messageSource
    ) {
        super(documentTemplateEngine);
        this.messageSource = messageSource;
    }

    public void fillInvoicingPlan(InvoicingPlan invoicingPlan) {
        this.invoicingPlan = invoicingPlan;
    }

    @Override
    protected String getTemplateName() {
        return "invoice";
    }

    @Override
    protected Context getContext() {
        Context context = new Context(Locale.FRENCH);

        Recipient recipient = new Recipient(invoicingPlan.getParticipation().getExhibitor());
        Sender sender = new Sender(invoicingPlan.getParticipation().getSalon()); // FIXME + logo

        /* HEADER */
        context.setVariable("headerTitle", this.messageSource.getMessage("document.invoice.header", null, Locale.FRENCH));
        context.setVariable("recipient", recipient);
        context.setVariable("sender", sender);

        /* TEMPLATE */
        context.setVariable("reference", invoicingPlan.getBillingNumber());
        context.setVariable("sentDate", LocalDate.now()); // FIXME format
        context.setVariable("expirationDate", LocalDate.now().plusDays(90)); // FIXME
        context.setVariable("contact", "Claude Pascal / Grillon Nathalie");
        context.setVariable("phone", "+41 79 964 78 75 / +41 79 690 18 71");

        context.setVariable("invoices", invoicingPlan.getInvoices());
        context.setVariable("hasPaidSomething", !invoicingPlan.getPayments().isEmpty());
        context.setVariable("paymentsTotal", invoicingPlan.getPaymentsTotal());
        context.setVariable("total", invoicingPlan.getTotal());

        context.setVariable("iban", "CH07 8080 8002 0290 1493 8");

        return context;
    }
}
