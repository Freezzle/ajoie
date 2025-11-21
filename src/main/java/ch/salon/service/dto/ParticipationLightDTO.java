package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;
import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class ParticipationLightDTO implements Serializable {

    private UUID id;
    private ExhibitorLightDTO exhibitor;
    private String therapistName;
    private Status status;
    private Boolean guestOfHonor;
    private Boolean crushOfHeart;
    private String extraInformation;
}
