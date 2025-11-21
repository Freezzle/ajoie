package ch.salon.service.dto;

import ch.salon.domain.enumeration.Category;
import ch.salon.domain.enumeration.Status;
import lombok.Data;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
public class StandDTO implements Serializable {

    private UUID id;
    private String description;
    private String website;
    private String instagram;
    private String facebook;
    private String urlPicture;
    private Boolean shared;
    private Long nbTable;
    private Long nbChair;
    private Boolean needElectricity;
    private Category category;
    private Set<String> subCategories = new HashSet<>();
    private Status status;
    private String extraInformation;
    private ParticipationLightDTO participation;
    private PriceStandLightDTO dimension;
}
