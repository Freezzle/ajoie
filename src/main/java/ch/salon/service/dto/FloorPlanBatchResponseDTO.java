package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
public class FloorPlanBatchResponseDTO implements Serializable {

    private List<FloorPlanSalonDTO> floorPlans = new ArrayList<>();
}
