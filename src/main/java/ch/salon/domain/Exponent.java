package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
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

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "exponent")
    @JsonIgnoreProperties(value = { "conferences", "payments", "invoices", "stands", "exponent", "salon" }, allowSetters = true)
    private Set<Participation> participations = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Exponent id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFullName() {
        return this.fullName;
    }

    public Exponent fullName(String fullName) {
        this.setFullName(fullName);
        return this;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return this.email;
    }

    public Exponent email(String email) {
        this.setEmail(email);
        return this;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return this.phoneNumber;
    }

    public Exponent phoneNumber(String phoneNumber) {
        this.setPhoneNumber(phoneNumber);
        return this;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return this.address;
    }

    public Exponent address(String address) {
        this.setAddress(address);
        return this;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNpaLocalite() {
        return this.npaLocalite;
    }

    public Exponent npaLocalite(String npaLocalite) {
        this.setNpaLocalite(npaLocalite);
        return this;
    }

    public void setNpaLocalite(String npaLocalite) {
        this.npaLocalite = npaLocalite;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public Exponent extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Set<Participation> getParticipations() {
        return this.participations;
    }

    public void setParticipations(Set<Participation> participations) {
        if (this.participations != null) {
            this.participations.forEach(i -> i.setExponent(null));
        }
        if (participations != null) {
            participations.forEach(i -> i.setExponent(this));
        }
        this.participations = participations;
    }

    public Exponent participations(Set<Participation> participations) {
        this.setParticipations(participations);
        return this;
    }

    public Exponent addParticipation(Participation participation) {
        this.participations.add(participation);
        participation.setExponent(this);
        return this;
    }

    public Exponent removeParticipation(Participation participation) {
        this.participations.remove(participation);
        participation.setExponent(null);
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
        return "Exponent{" +
            "id=" + getId() +
            ", fullName='" + getFullName() + "'" +
            ", email='" + getEmail() + "'" +
            ", phoneNumber='" + getPhoneNumber() + "'" +
            ", address='" + getAddress() + "'" +
            ", npaLocalite='" + getNpaLocalite() + "'" +
            ", extraInformation='" + getExtraInformation() + "'" +
            "}";
    }
}
