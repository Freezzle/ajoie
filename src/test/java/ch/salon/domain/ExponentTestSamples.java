package ch.salon.domain;

import java.util.UUID;

public class ExponentTestSamples {

    public static Exponent getExponentSample1() {
        return new Exponent()
            .id(UUID.fromString("23d8dc04-a48b-45d9-a01d-4b728f0ad4aa"))
            .email("email1")
            .fullName("fullName1")
            .phoneNumber("phoneNumber1")
            .website("website1")
            .socialMedia("socialMedia1")
            .address("address1")
            .npaLocalite("npaLocalite1")
            .urlPicture("urlPicture1")
            .comment("comment1");
    }

    public static Exponent getExponentSample2() {
        return new Exponent()
            .id(UUID.fromString("ad79f240-3727-46c3-b89f-2cf6ebd74367"))
            .email("email2")
            .fullName("fullName2")
            .phoneNumber("phoneNumber2")
            .website("website2")
            .socialMedia("socialMedia2")
            .address("address2")
            .npaLocalite("npaLocalite2")
            .urlPicture("urlPicture2")
            .comment("comment2");
    }

    public static Exponent getExponentRandomSampleGenerator() {
        return new Exponent()
            .id(UUID.randomUUID())
            .email(UUID.randomUUID().toString())
            .fullName(UUID.randomUUID().toString())
            .phoneNumber(UUID.randomUUID().toString())
            .website(UUID.randomUUID().toString())
            .socialMedia(UUID.randomUUID().toString())
            .address(UUID.randomUUID().toString())
            .npaLocalite(UUID.randomUUID().toString())
            .urlPicture(UUID.randomUUID().toString())
            .comment(UUID.randomUUID().toString());
    }
}
