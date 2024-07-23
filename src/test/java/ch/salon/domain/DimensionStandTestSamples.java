package ch.salon.domain;

import java.util.UUID;

public class DimensionStandTestSamples {

    public static DimensionStand getDimensionStandSample1() {
        return new DimensionStand().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).dimension("dimension1");
    }

    public static DimensionStand getDimensionStandSample2() {
        return new DimensionStand().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).dimension("dimension2");
    }

    public static DimensionStand getDimensionStandRandomSampleGenerator() {
        return new DimensionStand().id(UUID.randomUUID()).dimension(UUID.randomUUID().toString());
    }
}
