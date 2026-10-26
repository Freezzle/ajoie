package ch.salon.service;

import ch.salon.service.document.PostalParty;
import net.codecrete.qrbill.generator.Address;
import net.codecrete.qrbill.generator.Bill;
import net.codecrete.qrbill.generator.BillFormat;
import net.codecrete.qrbill.generator.GraphicsFormat;
import net.codecrete.qrbill.generator.Language;
import net.codecrete.qrbill.generator.OutputSize;
import net.codecrete.qrbill.generator.QRBill;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class GenerateQRCode {
    public String toDataUri(Bill bill) {
        BillFormat fmt = bill.getFormat() != null ? bill.getFormat() : new BillFormat();
        fmt.setGraphicsFormat(GraphicsFormat.PNG);
        fmt.setOutputSize(OutputSize.QR_BILL_EXTRA_SPACE);
        fmt.setLanguage(Language.FR);
        bill.setFormat(fmt);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(QRBill.generate(bill));
    }

    public Bill buildBill(String iban, double amount, String reference, String message, PostalParty creditor,
            PostalParty debtor) {

        Bill bill = new Bill();
        bill.setAccount(iban);
        bill.setAmountFromDouble(amount);
        bill.setCurrency("CHF");
        bill.setCreditor(toQrAddress(creditor));
        bill.setDebtor(toQrAddress(debtor));
        bill.setUnstructuredMessage(message);

        if (reference != null && !reference.isBlank()) {
            bill.setReference(reference);
        }

        return bill;
    }

    /** Les champs de la partie sont déjà structurés : rien à découper ici. */
    private static Address toQrAddress(PostalParty party) {
        Address address = new Address();
        address.setName(party.getQrName());
        address.setStreet(party.getStreet());
        address.setHouseNo(party.getHouseNumber());
        address.setPostalCode(party.getPostalCode());
        address.setTown(party.getCity());
        address.setCountryCode(party.getCountry());

        return address;
    }
}
