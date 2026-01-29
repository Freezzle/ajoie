package ch.salon.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class VolunteerPlanningDay {
    private String id;
    private String label;
    private String startTime;
    private String endTime;
    private List<String> assignedVolunteerIds = new ArrayList<>();
    private List<VolunteerPlanningCell> cells = new ArrayList<>();
}
