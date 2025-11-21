package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class StandLightDTO implements Serializable {

    private UUID id;
    private String description;
}
