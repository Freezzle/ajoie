package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class FloorPlanBatchRequestDTO implements Serializable {

    private List<FloorPlanSalonDTO> floorPlans = new ArrayList<>();
    private List<UUID> idsToDelete = new ArrayList<>();
}
