package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.Address;
import ch.salon.domain.BankAccount;
import ch.salon.domain.InvoicingPlan;
import ch.salon.service.GenerateQRCode;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.document.Recipient;
import ch.salon.service.document.Sender;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import ch.salon.utils.DateUtils;
import lombok.RequiredArgsConstructor;
import net.codecrete.qrbill.generator.Bill;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DownloadInvoiceHandler implements DocumentActionHandler<InvoicingPlan> {
    private static final Logger LOGGER = LoggerFactory.getLogger(DownloadInvoiceHandler.class.getName());

    private final MessageSource messageSource;
    private final DocumentCreator documentCreator;
    private final GenerateQRCode generateQRCode;

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
        thymeleafCtxt.setVariable("phone", "+41797686084 / +41768395523 / +41799647875");
        thymeleafCtxt.setVariable("arrangement", payload.getNeedArrangement());

        thymeleafCtxt.setVariable("invoices", payload.getInvoices());
        thymeleafCtxt.setVariable("payments", payload.getPayments());
        thymeleafCtxt.setVariable("hasPaidSomething", !payload.getPayments().isEmpty());
        thymeleafCtxt.setVariable("total", payload.getTotal());

        // Use Salon bank account IBAN
        String iban = payload.getParticipation().getSalon().getBankAccount() != null
                ? payload.getParticipation().getSalon().getBankAccount().getIban()
                : "CH0780808002029014938";
        thymeleafCtxt.setVariable("iban", BankAccount.formatIban(iban));

        try {
            Bill bill = generateQRCode.buildBill(
                    iban.replaceAll("\\s+", ""),
                    Math.max(0d, payload.getTotal()),
                    null,
                    "Facture " + payload.getBillingNumber(),
                    sender.getEnterpriseName(),
                    Address.extractStreetName(sender.getStreet()),
                    Address.extractHouseNumber(sender.getStreet()),
                    Address.extractPostalCode(sender.getCity()),
                    Address.extractCityName(sender.getCity()),
                    "CH",
                    recipient.getFullName(),
                    Address.extractStreetName(recipient.getStreet()),
                    Address.extractHouseNumber(recipient.getStreet()),
                    Address.extractPostalCode(recipient.getCity()),
                    Address.extractCityName(recipient.getCity()),
                    recipient.getCountry());

            String dataUri = generateQRCode.toDataUri(bill);
            thymeleafCtxt.setVariable("qrBillDataUri", dataUri);
        } catch (Exception e) {
            LOGGER.warn(e.getMessage(), e);
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
        return "Invoice_" + payload.getBillingNumber() + ".pdf";
    }
}
