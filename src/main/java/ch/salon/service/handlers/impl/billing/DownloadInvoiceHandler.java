package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.service.GenerateQRCode;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.document.Recipient;
import ch.salon.service.document.Sender;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import ch.salon.utils.DateUtils;
import net.codecrete.qrbill.generator.Bill;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Component
public class DownloadInvoiceHandler implements DocumentActionHandler<InvoicingPlan> {

    private final MessageSource messageSource;
    private final DocumentCreator documentCreator;
    private final GenerateQRCode generateQRCode;

    public DownloadInvoiceHandler(MessageSource messageSource, DocumentCreator documentCreator,
            GenerateQRCode generateQRCode) {
        this.messageSource = messageSource;
        this.documentCreator = documentCreator;
        this.generateQRCode = generateQRCode;
    }

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null ? SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public InputStreamSource download(InvoicingPlan payload, Map<String, Object> context) throws IOException {
        Recipient recipient = new Recipient(payload.getParticipation().getExhibitor());
        recipient.setEnterpriseName(payload.getParticipation().getTherapistName());
        Sender sender = new Sender(payload.getParticipation().getSalon()); // FIXME + logo

        Context thymeleafCtxt = new Context(recipient.getLanguage());
        /* HEADER */
        thymeleafCtxt.setVariable("headerTitle",
                this.messageSource.getMessage("document.invoice.header", null, recipient.getLanguage()));
        thymeleafCtxt.setVariable("recipient", recipient);
        thymeleafCtxt.setVariable("sender", sender);

        /* TEMPLATE */
        if (payload.getIssuedDate() != null) {
            thymeleafCtxt.setVariable("sentDate", DateUtils.instantToIso(payload.getIssuedDate()));
        } else {
            thymeleafCtxt.setVariable("sentDate", DateUtils.instantToIso(Instant.now()));
        }

        if (payload.getExpirationDate() != null) {
            thymeleafCtxt.setVariable("expirationDate", DateUtils.instantToIso(payload.getExpirationDate()));
        } else {
            thymeleafCtxt.setVariable("expirationDate",
                    DateUtils.instantToIso(InvoicingPlan.calculateExpirationDate(payload)));
        }

        thymeleafCtxt.setVariable("reference", payload.getBillingNumber());
        thymeleafCtxt.setVariable("contact", "Claude Pascal / Claude Charlène / Claude Dylan");
        thymeleafCtxt.setVariable("phone", "+41797686084 / +33783246337 / +41799647875");
        thymeleafCtxt.setVariable("arrangement", payload.getNeedArrangement());

        thymeleafCtxt.setVariable("invoices", payload.getInvoices());
        thymeleafCtxt.setVariable("payments", payload.getPayments());
        thymeleafCtxt.setVariable("hasPaidSomething", !payload.getPayments().isEmpty());
        thymeleafCtxt.setVariable("total", payload.getTotal());

        thymeleafCtxt.setVariable("iban", "CH07 8080 8002 0290 1493 8");

        try {
            Bill bill = generateQRCode.buildBill("CH0780808002029014938", Math.max(0d, payload.getTotal()), null,
                    "Facture " + payload.getBillingNumber(), sender.getEnterpriseName(), "Sous les chênes", "109A",
                    sender.getCity().split(" ")[0], sender.getCity().split(" ")[1], "CH", recipient.getFullName(),
                    recipient.getStreet(), null, recipient.getCity().split(" ")[0],
                    recipient.getCity().split(" ", 2)[1], "CH");

            String dataUri = generateQRCode.toDataUri(bill);
            thymeleafCtxt.setVariable("qrBillDataUri", dataUri);
        } catch (Exception e) {
            // en cas d’erreur, on masque l’image côté template
            thymeleafCtxt.setVariable("qrBillDataUri", null);
        }

        return this.documentCreator.build("invoice", thymeleafCtxt);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_DOWNLOAD;
    }

    @Override
    public String getFilename(InvoicingPlan payload, Map<String, Object> context) {
        return "invoice-" + payload.getBillingNumber() + ".pdf";
    }
}
