package ch.salon.service;

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

    public Bill buildBill(String iban, double amount, String reference, String message, String creditorName,
            String creditorStreet, String creditorHouseNo, String creditorZip, String creditorCity,
            String creditorCountry, String debtorName, String debtorStreet, String debtorHouseNo, String debtorZip,
            String debtorCity, String debtorCountry) {

        Address creditor = new Address();
        creditor.setName(creditorName);
        creditor.setStreet(creditorStreet);
        creditor.setHouseNo(creditorHouseNo);
        creditor.setPostalCode(creditorZip);
        creditor.setTown(creditorCity);
        creditor.setCountryCode(creditorCountry);

        Address debtor = new Address();
        debtor.setName(debtorName);
        debtor.setStreet(debtorStreet);
        debtor.setHouseNo(debtorHouseNo);
        debtor.setPostalCode(debtorZip);
        debtor.setTown(debtorCity);
        debtor.setCountryCode(debtorCountry);

        Bill bill = new Bill();
        bill.setAccount(iban);
        bill.setAmountFromDouble(amount);
        bill.setCurrency("CHF");
        bill.setCreditor(creditor);
        bill.setDebtor(debtor);
        bill.setUnstructuredMessage(message);

        if (reference != null && !reference.isBlank()) {
            bill.setReference(reference);
        }

        return bill;
    }
}
