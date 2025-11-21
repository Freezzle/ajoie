package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class SalonLightDTO implements Serializable {

    private UUID id;
    private String place;
}
