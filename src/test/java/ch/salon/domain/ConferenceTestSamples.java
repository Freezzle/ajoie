package ch.salon.domain;

import java.util.UUID;

public class ConferenceTestSamples {

    public static Conference getConferenceSample1() {
        return new Conference().id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa")).title("title1");
    }

    public static Conference getConferenceSample2() {
        return new Conference().id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367")).title("title2");
    }

    public static Conference getConferenceRandomSampleGenerator() {
        return new Conference().id(UUID.randomUUID()).title(UUID.randomUUID().toString());
    }
}
