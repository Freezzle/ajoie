package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class ExhibitorLightDTO implements Serializable {

    private UUID id;
    private String email;
    private String fullName;
    private boolean redFlag;
}
