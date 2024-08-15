package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.UUID;

/**
 * A Exponent.
 */
@Entity
@Table(name = "exponent")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Exponent implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "npa_localite")
    private String npaLocalite;

    @Column(name = "extra_information")
    private String extraInformation;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Exponent id(UUID id) {
        this.setId(id);
        return this;
    }

    public String getFullName() {
        return this.fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Exponent fullName(String fullName) {
        this.setFullName(fullName);
        return this;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Exponent email(String email) {
        this.setEmail(email);
        return this;
    }

    public String getPhoneNumber() {
        return this.phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Exponent phoneNumber(String phoneNumber) {
        this.setPhoneNumber(phoneNumber);
        return this;
    }

    public String getAddress() {
        return this.address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Exponent address(String address) {
        this.setAddress(address);
        return this;
    }

    public String getNpaLocalite() {
        return this.npaLocalite;
    }

    public void setNpaLocalite(String npaLocalite) {
        this.npaLocalite = npaLocalite;
    }

    public Exponent npaLocalite(String npaLocalite) {
        this.setNpaLocalite(npaLocalite);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Exponent extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Exponent)) {
            return false;
        }
        return getId() != null && getId().equals(((Exponent) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Exponent{" + "id=" + getId() + ", fullName='" + getFullName() + "'" + ", email='" + getEmail() + "'" +
               ", phoneNumber='" + getPhoneNumber() + "'" + ", address='" + getAddress() + "'" + ", npaLocalite='" +
               getNpaLocalite() + "'" + ", extraInformation='" + getExtraInformation() + "'" + "}";
    }
}
