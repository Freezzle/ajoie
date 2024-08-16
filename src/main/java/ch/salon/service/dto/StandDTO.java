package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;

import java.io.Serializable;
import java.util.UUID;

public class StandDTO implements Serializable {

    private UUID id;

    private String description;

    private String website;

    private String socialMedia;

    private String urlPicture;

    private Boolean shared;

    private Long nbTable;

    private Long nbChair;

    private Boolean needElectricity;

    private Status status;

    private String extraInformation;

    private ParticipationLightDTO participation;

    private DimensionStandLightDTO dimension;

    public StandDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getSocialMedia() {
        return socialMedia;
    }

    public void setSocialMedia(String socialMedia) {
        this.socialMedia = socialMedia;
    }

    public String getUrlPicture() {
        return urlPicture;
    }

    public void setUrlPicture(String urlPicture) {
        this.urlPicture = urlPicture;
    }

    public Boolean getShared() {
        return shared;
    }

    public void setShared(Boolean shared) {
        this.shared = shared;
    }

    public Long getNbTable() {
        return nbTable;
    }

    public void setNbTable(Long nbTable) {
        this.nbTable = nbTable;
    }

    public Long getNbChair() {
        return nbChair;
    }

    public void setNbChair(Long nbChair) {
        this.nbChair = nbChair;
    }

    public Boolean getNeedElectricity() {
        return needElectricity;
    }

    public void setNeedElectricity(Boolean needElectricity) {
        this.needElectricity = needElectricity;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getExtraInformation() {
        return extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public ParticipationLightDTO getParticipation() {
        return participation;
    }

    public void setParticipation(ParticipationLightDTO participation) {
        this.participation = participation;
    }

    public DimensionStandLightDTO getDimension() {
        return dimension;
    }

    public void setDimension(DimensionStandLightDTO dimension) {
        this.dimension = dimension;
    }
}
