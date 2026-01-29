package ch.salon.domain;

import lombok.Data;

@Data
public class VolunteerPlanningCell {
    private String volunteerId;
    private int slotIndex;
    private String categoryId;
}
