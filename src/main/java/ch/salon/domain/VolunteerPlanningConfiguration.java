package ch.salon.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class VolunteerPlanningConfiguration {
    private Integer intervalMinutes;
    private List<VolunteerPlanningCategory> categories = new ArrayList<>();
    private List<VolunteerPlanningDay> days = new ArrayList<>();
}
