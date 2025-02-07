package ch.salon.service.document;

import ch.salon.domain.InvoicingPlan;
import ch.salon.utils.DateUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Component
public class InvoiceDocumentCreator extends AbstractDocumentCreator {

    private final MessageSource messageSource;
    private InvoicingPlan invoicingPlan;

    public InvoiceDocumentCreator(@Qualifier("documentTemplateEngine") SpringTemplateEngine documentTemplateEngine,
                                  MessageSource messageSource) {
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
        Recipient recipient = new Recipient(invoicingPlan.getParticipation().getExhibitor());
        Sender sender = new Sender(invoicingPlan.getParticipation().getSalon()); // FIXME + logo

        Context context = new Context(recipient.getLanguage());
        /* HEADER */
        context.setVariable("headerTitle",
                            this.messageSource.getMessage("document.invoice.header", null, recipient.getLanguage()));
        context.setVariable("recipient", recipient);
        context.setVariable("sender", sender);

        /* TEMPLATE */
        context.setVariable("reference", invoicingPlan.getBillingNumber());
        context.setVariable("sentDate", DateUtils.instantToIso(invoicingPlan.getIssuedDate()));
        context.setVariable("expirationDate", DateUtils.instantToIso(invoicingPlan.getExpirationDate()));
        context.setVariable("contact", "Claude Pascal / Grillon Nathalie");
        context.setVariable("phone", "+41 79 964 78 75 / +41 79 690 18 71");
        context.setVariable("arrangement", invoicingPlan.getParticipation().getNeedArrangment());

        context.setVariable("invoices", invoicingPlan.getInvoices());
        context.setVariable("payments", invoicingPlan.getPayments());
        context.setVariable("hasPaidSomething", !invoicingPlan.getPayments().isEmpty());
        context.setVariable("total", invoicingPlan.getTotal());

        context.setVariable("iban", "CH07 8080 8002 0290 1493 8");

        return context;
    }
}
