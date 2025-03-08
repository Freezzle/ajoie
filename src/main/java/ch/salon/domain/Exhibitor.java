package ch.salon.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "exhibitor")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Exhibitor implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "language",
            nullable = false)
    private String language = Locale.FRENCH.getLanguage();

    @NotNull
    @Column(name = "full_name",
            nullable = false)
    private String fullName;

    @NotNull
    @Column(name = "email",
            nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "npa_localite")
    private String npaLocalite;

    @Column(name = "extra_information")
    private String extraInformation;

    @Column(name = "different_billing_address")
    private Boolean differentBillingAddress = false;

    @ManyToOne(fetch = FetchType.EAGER,
               cascade = CascadeType.ALL)
    private Address billingAddress;

    @Column(name = "registration_date")
    private Instant registrationDate;

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Exhibitor id(UUID id) {
        this.setId(id);
        return this;
    }

    public String getFullName() {
        return this.fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Exhibitor fullName(String fullName) {
        this.setFullName(fullName);
        return this;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Exhibitor email(String email) {
        this.setEmail(email);
        return this;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(@NotNull String language) {
        this.language = language;
    }

    public String getPhoneNumber() {
        return this.phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Exhibitor phoneNumber(String phoneNumber) {
        this.setPhoneNumber(phoneNumber);
        return this;
    }

    public String getAddress() {
        return this.address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Exhibitor address(String address) {
        this.setAddress(address);
        return this;
    }

    public String getNpaLocalite() {
        return this.npaLocalite;
    }

    public void setNpaLocalite(String npaLocalite) {
        this.npaLocalite = npaLocalite;
    }

    public Exhibitor npaLocalite(String npaLocalite) {
        this.setNpaLocalite(npaLocalite);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Exhibitor extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public Boolean getDifferentBillingAddress() {
        return differentBillingAddress;
    }

    public void setDifferentBillingAddress(Boolean differentBillingAddress) {
        this.differentBillingAddress = differentBillingAddress;
    }

    public Address getBillingAddress() {
        return billingAddress;
    }

    public void setBillingAddress(Address billingAddress) {
        this.billingAddress = billingAddress;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Exhibitor)) {
            return false;
        }
        return getId() != null && getId().equals(((Exhibitor) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return ("Exhibitor{" + "id=" + id + ", fullName='" + fullName + '\'' + ", email='" + email + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' + ", address='" + address + '\'' + ", npaLocalite='" +
                npaLocalite + '\'' + ", extraInformation='" + extraInformation + '\'' + '}');
    }
}
