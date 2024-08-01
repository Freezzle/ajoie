package ch.salon.domain;

import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.UUID;

/**
 * A Stand.
 */
@Entity
@Table(name = "stand")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Stand implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "website")
    private String website;

    @Column(name = "social_media")
    private String socialMedia;

    @Column(name = "url_picture")
    private String urlPicture;

    @Column(name = "shared")
    private Boolean shared;

    @Column(name = "nb_table")
    private Long nbTable;

    @Column(name = "nb_chair")
    private Long nbChair;

    @Column(name = "need_electricity")
    private Boolean needElectricity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "conferences", "payments", "invoices", "stands", "exponent", "salon" }, allowSetters = true)
    private Participation participation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "priceStandSalons", "stands" }, allowSetters = true)
    private DimensionStand dimension;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Stand id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getDescription() {
        return this.description;
    }

    public Stand description(String description) {
        this.setDescription(description);
        return this;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getWebsite() {
        return this.website;
    }

    public Stand website(String website) {
        this.setWebsite(website);
        return this;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getSocialMedia() {
        return this.socialMedia;
    }

    public Stand socialMedia(String socialMedia) {
        this.setSocialMedia(socialMedia);
        return this;
    }

    public void setSocialMedia(String socialMedia) {
        this.socialMedia = socialMedia;
    }

    public String getUrlPicture() {
        return this.urlPicture;
    }

    public Stand urlPicture(String urlPicture) {
        this.setUrlPicture(urlPicture);
        return this;
    }

    public void setUrlPicture(String urlPicture) {
        this.urlPicture = urlPicture;
    }

    public Boolean getShared() {
        return this.shared;
    }

    public Stand shared(Boolean shared) {
        this.setShared(shared);
        return this;
    }

    public void setShared(Boolean shared) {
        this.shared = shared;
    }

    public Long getNbTable() {
        return this.nbTable;
    }

    public Stand nbTable(Long nbTable) {
        this.setNbTable(nbTable);
        return this;
    }

    public void setNbTable(Long nbTable) {
        this.nbTable = nbTable;
    }

    public Long getNbChair() {
        return this.nbChair;
    }

    public Stand nbChair(Long nbChair) {
        this.setNbChair(nbChair);
        return this;
    }

    public void setNbChair(Long nbChair) {
        this.nbChair = nbChair;
    }

    public Boolean getNeedElectricity() {
        return this.needElectricity;
    }

    public Stand needElectricity(Boolean needElectricity) {
        this.setNeedElectricity(needElectricity);
        return this;
    }

    public void setNeedElectricity(Boolean needElectricity) {
        this.needElectricity = needElectricity;
    }

    public Status getStatus() {
        return this.status;
    }

    public Stand status(Status status) {
        this.setStatus(status);
        return this;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public Stand extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Participation getParticipation() {
        return this.participation;
    }

    public void setParticipation(Participation participation) {
        this.participation = participation;
    }

    public Stand participation(Participation participation) {
        this.setParticipation(participation);
        return this;
    }

    public DimensionStand getDimension() {
        return this.dimension;
    }

    public void setDimension(DimensionStand dimensionStand) {
        this.dimension = dimensionStand;
    }

    public Stand dimension(DimensionStand dimensionStand) {
        this.setDimension(dimensionStand);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Stand)) {
            return false;
        }
        return getId() != null && getId().equals(((Stand) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Stand{" +
            "id=" + getId() +
            ", description='" + getDescription() + "'" +
            ", website='" + getWebsite() + "'" +
            ", socialMedia='" + getSocialMedia() + "'" +
            ", urlPicture='" + getUrlPicture() + "'" +
            ", shared='" + getShared() + "'" +
            ", nbTable=" + getNbTable() +
            ", nbChair=" + getNbChair() +
            ", needElectricity='" + getNeedElectricity() + "'" +
            ", status='" + getStatus() + "'" +
            ", extraInformation='" + getExtraInformation() + "'" +
            "}";
    }
}
