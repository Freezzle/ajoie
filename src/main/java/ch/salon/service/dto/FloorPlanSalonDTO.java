package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class FloorPlanSalonDTO implements Serializable {

    private UUID id;
    private Long position;
    private String name;
    private String data;
}
