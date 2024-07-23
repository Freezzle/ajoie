package ch.salon.domain;

import java.util.UUID;

public class SalonTestSamples {

    public static Salon getSalonSample1() {
        return new Salon().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).place("place1");
    }

    public static Salon getSalonSample2() {
        return new Salon().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).place("place2");
    }

    public static Salon getSalonRandomSampleGenerator() {
        return new Salon().id(UUID.randomUUID()).place(UUID.randomUUID().toString());
    }
}
