package ch.salon.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TimelineData {
    private String eventId;
    private int intervalMinutes;
    private List<TimelineDay> days = new ArrayList<>();
    private List<TimelineRoom> rooms = new ArrayList<>();
}
