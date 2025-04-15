package ch.salon.domain;

import ch.salon.domain.enumeration.Category;
import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

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
    @Column(name = "description",
            nullable = false)
    private String description;

    @Column(name = "website")
    private String website;

    @Column(name = "instagram")
    private String instagram;

    @Column(name = "facebook")
    private String facebook;

    @Column(name = "url_picture")
    private String urlPicture;

    @Column(name = "shared")
    private Boolean shared;

    @Column(name = "nb_table")
    private Long nbTable;

    @Column(name = "nb_chair")
    private Long nbChair;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Category category;

    @Column(name = "need_electricity")
    private Boolean needElectricity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"exhibitor", "salon"},
                          allowSetters = true)
    private Participation participation;

    @ManyToOne(fetch = FetchType.LAZY)
    private DimensionStand dimension;

    @Column(name = "registration_date")
    private Instant registrationDate;

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Stand id(UUID id) {
        this.setId(id);
        return this;
    }

    public Instant getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Stand description(String description) {
        this.setDescription(description);
        return this;
    }

    public String getWebsite() {
        return this.website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public Stand website(String website) {
        this.setWebsite(website);
        return this;
    }

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getFacebook() {
        return facebook;
    }

    public void setFacebook(String facebook) {
        this.facebook = facebook;
    }

    public String getUrlPicture() {
        return this.urlPicture;
    }

    public void setUrlPicture(String urlPicture) {
        this.urlPicture = urlPicture;
    }

    public Stand urlPicture(String urlPicture) {
        this.setUrlPicture(urlPicture);
        return this;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Boolean getShared() {
        return this.shared;
    }

    public void setShared(Boolean shared) {
        this.shared = shared;
    }

    public Stand shared(Boolean shared) {
        this.setShared(shared);
        return this;
    }

    public Long getNbTable() {
        return this.nbTable;
    }

    public void setNbTable(Long nbTable) {
        this.nbTable = nbTable;
    }

    public Stand nbTable(Long nbTable) {
        this.setNbTable(nbTable);
        return this;
    }

    public Long getNbChair() {
        return this.nbChair;
    }

    public void setNbChair(Long nbChair) {
        this.nbChair = nbChair;
    }

    public Stand nbChair(Long nbChair) {
        this.setNbChair(nbChair);
        return this;
    }

    public Boolean getNeedElectricity() {
        return this.needElectricity;
    }

    public void setNeedElectricity(Boolean needElectricity) {
        this.needElectricity = needElectricity;
    }

    public Stand needElectricity(Boolean needElectricity) {
        this.setNeedElectricity(needElectricity);
        return this;
    }

    public Status getStatus() {
        return this.status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Stand status(Status status) {
        this.setStatus(status);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Stand extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
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

    public static boolean diffDimension(Stand stand1, Stand stand2) {
        if (stand1 == null && stand2 != null) {
            return true;
        }
        if (stand1 != null && stand2 == null) {
            return true;
        }
        if (stand1 != null && stand2 != null) {
            UUID dim1Id = stand1.getDimension().getId();
            UUID dim2Id = stand2.getDimension().getId();
            return !Objects.equals(dim1Id, dim2Id);
        }
        return false;
    }

    public static boolean diffShared(Stand stand1, Stand stand2) {
        if (stand1 == null && stand2 != null) {
            return true;
        }
        if (stand1 != null && stand2 == null) {
            return true;
        }
        if (stand1 != null && stand2 != null) {
            return !Objects.equals(stand1.getShared(), stand2.getShared());
        }
        return false;
    }

    public static boolean diffStatus(Stand stand1, Stand stand2) {
        if (stand1 == null && stand2 != null) {
            return true;
        }
        if (stand1 != null && stand2 == null) {
            return true;
        }
        if (stand1 != null && stand2 != null) {
            return !Objects.equals(stand1.getStatus(), stand2.getStatus());
        }
        return false;
    }

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

    @Override
    public String toString() {
        return ("Stand{" + "id=" + id + ", description='" + description + '\'' + ", website='" + website + '\'' +
                ", instagram='" + instagram + '\'' + ", facebook='" + facebook + '\'' + ", urlPicture='" + urlPicture +
                '\'' + ", shared=" + shared + ", nbTable=" + nbTable + ", nbChair=" + nbChair + ", needElectricity=" +
                needElectricity + ", status=" + status + ", category=" + category + ", extraInformation='" +
                extraInformation + '\'' + ", participation=" + participation + ", dimension=" + dimension + '}');
    }
}
