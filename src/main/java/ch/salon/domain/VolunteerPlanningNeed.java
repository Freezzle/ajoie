package ch.salon.domain;

import lombok.Data;

@Data
public class VolunteerPlanningNeed {
    private String categoryId;
    private int slotIndex;
    private int min;
}
