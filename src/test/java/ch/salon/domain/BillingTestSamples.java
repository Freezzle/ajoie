package ch.salon.domain;

import java.util.UUID;

public class BillingTestSamples {

    public static Billing getBillingSample1() {
        return new Billing().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa"));
    }

    public static Billing getBillingSample2() {
        return new Billing().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367"));
    }

    public static Billing getBillingRandomSampleGenerator() {
        return new Billing().id(UUID.randomUUID());
    }
}
