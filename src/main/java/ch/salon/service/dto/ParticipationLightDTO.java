package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;

import java.io.Serializable;
import java.util.UUID;

public class ParticipationLightDTO implements Serializable {

    private UUID id;
    private ExhibitorLightDTO exhibitor;
    private String therapistName;
    private Status status;
    private String extraInformation;

    public ParticipationLightDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTherapistName() {
        return therapistName;
    }

    public void setTherapistName(String therapistName) {
        this.therapistName = therapistName;
    }

    public ExhibitorLightDTO getExhibitor() {
        return exhibitor;
    }

    public void setExhibitor(ExhibitorLightDTO exhibitor) {
        this.exhibitor = exhibitor;
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
}
