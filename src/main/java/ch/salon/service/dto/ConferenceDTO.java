package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;

import java.io.Serializable;
import java.util.UUID;

public class ConferenceDTO implements Serializable {

    private UUID id;
    private String title;
    private Status status;
    private String extraInformation;
    private ParticipationLightDTO participation;

    public ConferenceDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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
}
