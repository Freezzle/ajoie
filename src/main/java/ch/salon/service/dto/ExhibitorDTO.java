package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class ExhibitorDTO implements Serializable {

    private UUID id;
    private String language;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private AddressDTO homeAddress;
    private String extraInformation;
    private Boolean differentBillingAddress;
    private AddressDTO billingAddress;
    private BankAccountDTO bankAccount;
    private boolean newsletter;
    private boolean redFlag = false;
    private boolean duplicateDetected = false;
}
