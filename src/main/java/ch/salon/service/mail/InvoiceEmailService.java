package ch.salon.service.mail;

import static ch.salon.domain.enumeration.EmailTemplate.INVOICE_EMAIL;

import ch.salon.EmailData;
import ch.salon.domain.InvoicingPlan;
import ch.salon.service.MailService;
import ch.salon.service.document.InvoiceDocumentCreator;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class InvoiceEmailService {

    private MailService mailService;
    private InvoiceDocumentCreator invoiceDocumentCreator;

    public InvoiceEmailService(MailService mailService, InvoiceDocumentCreator invoiceDocumentCreator) {
        this.mailService = mailService;
        this.invoiceDocumentCreator = invoiceDocumentCreator;
    }

    public void send(InvoicingPlan invoicingPlan) throws Exception {
        EmailData emailData = new EmailData();
        emailData.setTemplate(INVOICE_EMAIL);
        emailData.setContext(new InvoiceEmailDataProvider(invoicingPlan).getContext());
        emailData.setAttachments(Map.of("invoice.pdf", invoiceDocumentCreator.generate(invoicingPlan)));

        Object[] args = { invoicingPlan.getBillingNumber(), invoicingPlan.getParticipation().getSalon().getPlace() };

        mailService.sendEmailSync(emailData, invoicingPlan.getParticipation().getExhibitor().getEmail(), args);
    }
}
