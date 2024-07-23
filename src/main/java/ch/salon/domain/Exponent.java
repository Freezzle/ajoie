package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
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

    @Column(name = "email")
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "website")
    private String website;

    @Column(name = "social_media")
    private String socialMedia;

    @Column(name = "address")
    private String address;

    @Column(name = "npa_localite")
    private String npaLocalite;

    @Column(name = "url_picture")
    private String urlPicture;

    @Column(name = "comment")
    private String comment;

    @Column(name = "blocked")
    private Boolean blocked;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "exponent")
    @JsonIgnoreProperties(value = { "billing", "exponent", "salon", "dimension" }, allowSetters = true)
    private Set<Stand> stands = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "exponent")
    @JsonIgnoreProperties(value = { "salon", "exponent" }, allowSetters = true)
    private Set<Conference> conferences = new HashSet<>();

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

    public String getWebsite() {
        return this.website;
    }

    public Exponent website(String website) {
        this.setWebsite(website);
        return this;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getSocialMedia() {
        return this.socialMedia;
    }

    public Exponent socialMedia(String socialMedia) {
        this.setSocialMedia(socialMedia);
        return this;
    }

    public void setSocialMedia(String socialMedia) {
        this.socialMedia = socialMedia;
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

    public String getUrlPicture() {
        return this.urlPicture;
    }

    public Exponent urlPicture(String urlPicture) {
        this.setUrlPicture(urlPicture);
        return this;
    }

    public void setUrlPicture(String urlPicture) {
        this.urlPicture = urlPicture;
    }

    public String getComment() {
        return this.comment;
    }

    public Exponent comment(String comment) {
        this.setComment(comment);
        return this;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Boolean getBlocked() {
        return this.blocked;
    }

    public Exponent blocked(Boolean blocked) {
        this.setBlocked(blocked);
        return this;
    }

    public void setBlocked(Boolean blocked) {
        this.blocked = blocked;
    }

    public Set<Stand> getStands() {
        return this.stands;
    }

    public void setStands(Set<Stand> stands) {
        if (this.stands != null) {
            this.stands.forEach(i -> i.setExponent(null));
        }
        if (stands != null) {
            stands.forEach(i -> i.setExponent(this));
        }
        this.stands = stands;
    }

    public Exponent stands(Set<Stand> stands) {
        this.setStands(stands);
        return this;
    }

    public Exponent addStand(Stand stand) {
        this.stands.add(stand);
        stand.setExponent(this);
        return this;
    }

    public Exponent removeStand(Stand stand) {
        this.stands.remove(stand);
        stand.setExponent(null);
        return this;
    }

    public Set<Conference> getConferences() {
        return this.conferences;
    }

    public void setConferences(Set<Conference> conferences) {
        if (this.conferences != null) {
            this.conferences.forEach(i -> i.setExponent(null));
        }
        if (conferences != null) {
            conferences.forEach(i -> i.setExponent(this));
        }
        this.conferences = conferences;
    }

    public Exponent conferences(Set<Conference> conferences) {
        this.setConferences(conferences);
        return this;
    }

    public Exponent addConference(Conference conference) {
        this.conferences.add(conference);
        conference.setExponent(this);
        return this;
    }

    public Exponent removeConference(Conference conference) {
        this.conferences.remove(conference);
        conference.setExponent(null);
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
            ", email='" + getEmail() + "'" +
            ", fullName='" + getFullName() + "'" +
            ", phoneNumber='" + getPhoneNumber() + "'" +
            ", website='" + getWebsite() + "'" +
            ", socialMedia='" + getSocialMedia() + "'" +
            ", address='" + getAddress() + "'" +
            ", npaLocalite='" + getNpaLocalite() + "'" +
            ", urlPicture='" + getUrlPicture() + "'" +
            ", comment='" + getComment() + "'" +
            ", blocked='" + getBlocked() + "'" +
            "}";
    }
}
