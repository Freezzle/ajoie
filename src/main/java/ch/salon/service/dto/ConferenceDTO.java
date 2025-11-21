package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;
import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class ConferenceDTO implements Serializable {

    private UUID id;
    private String title;
    private String description;
    private Status status;
    private String extraInformation;
    private ParticipationLightDTO participation;
}
