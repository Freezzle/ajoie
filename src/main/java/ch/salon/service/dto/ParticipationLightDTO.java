package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class ParticipationLightDTO implements Serializable {

    private UUID id;
    private ExhibitorLightDTO exhibitor;

    public ParticipationLightDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ExhibitorLightDTO getExhibitor() {
        return exhibitor;
    }

    public void setExhibitor(ExhibitorLightDTO exhibitor) {
        this.exhibitor = exhibitor;
    }
}
