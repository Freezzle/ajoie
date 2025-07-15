package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class ExhibitorDTO implements Serializable {

    private UUID id;

    private String language;

    private String fullName;

    private String email;

    private String phoneNumber;

    private String address;

    private String npaLocalite;

    private String extraInformation;

    private Boolean differentBillingAddress;

    private AddressDTO billingAddress;

    private boolean newsletter;

    private boolean redFlag = false;

    private boolean duplicateDetected = false;

    public ExhibitorDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNpaLocalite() {
        return npaLocalite;
    }

    public void setNpaLocalite(String npaLocalite) {
        this.npaLocalite = npaLocalite;
    }

    public String getExtraInformation() {
        return extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Boolean getDifferentBillingAddress() {
        return differentBillingAddress;
    }

    public void setDifferentBillingAddress(Boolean differentBillingAddress) {
        this.differentBillingAddress = differentBillingAddress;
    }

    public AddressDTO getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(AddressDTO billingAddress) {
        this.billingAddress = billingAddress;
    }

    public boolean isNewsletter() {
        return newsletter;
    }

    public void setNewsletter(boolean newsletter) {
        this.newsletter = newsletter;
    }

    public boolean isRedFlag() {
        return redFlag;
    }

    public void setRedFlag(boolean redFlag) {
        this.redFlag = redFlag;
    }

    public boolean isDuplicateDetected() {
        return duplicateDetected;
    }

    public void setDuplicateDetected(boolean duplicateDetected) {
        this.duplicateDetected = duplicateDetected;
    }
}
