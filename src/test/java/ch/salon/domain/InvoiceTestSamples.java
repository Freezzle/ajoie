package ch.salon.domain;

import java.util.UUID;

public class InvoiceTestSamples {

    public static Invoice getInvoiceSample1() {
        return new Invoice()
            .id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa"))
            .paymentMode("paymentMode1")
            .extraInformation("extraInformation1");
    }

    public static Invoice getInvoiceSample2() {
        return new Invoice()
            .id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367"))
            .paymentMode("paymentMode2")
            .extraInformation("extraInformation2");
    }

    public static Invoice getInvoiceRandomSampleGenerator() {
        return new Invoice().id(UUID.randomUUID()).paymentMode(UUID.randomUUID().toString()).extraInformation(UUID.randomUUID().toString());
    }
}
