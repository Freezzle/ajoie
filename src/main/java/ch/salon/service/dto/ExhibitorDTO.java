package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class ExhibitorDTO implements Serializable {

    private UUID id;
    private String language;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String npaLocalite;
    private String isoCountry;
    private String extraInformation;
    private Boolean differentBillingAddress;
    private AddressDTO billingAddress;
    private boolean newsletter;
    private boolean redFlag = false;
    private boolean duplicateDetected = false;
}
