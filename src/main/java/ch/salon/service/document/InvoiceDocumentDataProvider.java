package ch.salon.service.document;

import ch.salon.domain.InvoicingPlan;
import java.time.LocalDate;
import org.thymeleaf.context.Context;

public class InvoiceDocumentDataProvider implements DocumentDataProvider {

    private final InvoicingPlan invoicingPlan;

    public InvoiceDocumentDataProvider(InvoicingPlan invoicingPlan) {
        this.invoicingPlan = invoicingPlan;
    }

    @Override
    public String getTemplateName() {
        return "invoice";
    }

    @Override
    public Context getContext() {
        Context context = new Context();

        Recipient recipient = new Recipient(invoicingPlan.getParticipation().getExhibitor());

        Sender sender = new Sender(invoicingPlan.getParticipation().getSalon()); // FIXME + logo

        /* HEADER */
        context.setVariable("headerTitle", "FACTURE");
        context.setVariable("recipient", recipient);
        context.setVariable("sender", sender);

        /* Template */
        context.setVariable("reference", invoicingPlan.getBillingNumber());
        context.setVariable("sentDate", LocalDate.now()); // FIXME format
        context.setVariable("expirationDate", LocalDate.now().plusDays(90)); // FIXME
        context.setVariable("contact", "Claude Pascal / Grillon Nathalie");
        context.setVariable("phone", "+41 79 964 78 75 / +41 690 18 71");

        context.setVariable("invoices", invoicingPlan.getInvoices());
        context.setVariable("hasPaidSomething", !invoicingPlan.getPayments().isEmpty());
        context.setVariable("paymentsTotal", invoicingPlan.getPaymentsTotal());
        context.setVariable("total", invoicingPlan.getTotal());

        context.setVariable("iban", "CH07 8080 8002 0290 1493 8");

        return context;
    }
}
