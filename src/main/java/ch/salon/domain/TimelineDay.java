package ch.salon.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TimelineDay {
    private String id;
    private String label;
    private List<TimelineRoomData> rooms = new ArrayList<>();
}
