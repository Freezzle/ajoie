package ch.salon.service.mail;

import ch.salon.domain.InvoicingPlan;
import ch.salon.service.document.InvoiceReceiptDocumentCreator;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Component
public class InvoiceReceiptEmailCreator extends AbstractEmailCreator {

    private final InvoiceReceiptDocumentCreator invoiceReceiptDocumentCreator;
    private final MessageSource messageSource;
    private InvoicingPlan invoicingPlan;

    public InvoiceReceiptEmailCreator(
        InvoiceReceiptDocumentCreator invoiceReceiptDocumentCreator,
        MessageSource messageSource,
        JavaMailSender javaMailSender,
        @Qualifier("mailTemplateEngine") SpringTemplateEngine mailTemplateEngine
    ) {
        super(javaMailSender, mailTemplateEngine);
        this.invoiceReceiptDocumentCreator = invoiceReceiptDocumentCreator;
        this.messageSource = messageSource;
    }

    public void fillInvoicingPlan(InvoicingPlan invoicingPlan) throws Exception {
        this.invoicingPlan = invoicingPlan;
    }

    @Override
    protected String getTranslatedSubject() {
        Object[] args = { invoicingPlan.getParticipation().getSalon().getPlace() };
        return this.messageSource.getMessage("email.invoice-receipt.title", args, getContext().getLocale());
    }

    @Override
    protected String getTemplateName() {
        return "invoiceReceiptEmail";
    }

    @Override
    protected String getSenderEmail() {
        return "dylan.claude.work@gmail.com";
    }

    @Override
    protected String getRecipientEmail() {
        return this.invoicingPlan.getParticipation().getExhibitor().getEmail();
    }

    @Override
    protected Context getContext() {
        Context context = new Context(Locale.FRENCH);
        context.setVariable("salon", invoicingPlan.getParticipation().getSalon().getPlace());
        context.setVariable("billingNumber", invoicingPlan.getBillingNumber());
        context.setVariable("fullName", invoicingPlan.getParticipation().getExhibitor().getFullName());
        return context;
    }

    @Override
    public Map<String, InputStreamSource> getAttachments() throws Exception {
        this.invoiceReceiptDocumentCreator.fillInvoicingPlan(invoicingPlan);
        return Map.of("Quittance_" + invoicingPlan.getBillingNumber() + ".pdf", invoiceReceiptDocumentCreator.generate());
    }
}
