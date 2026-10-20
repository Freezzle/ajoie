package ch.salon.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Data
public class TimelineData {
    private String eventId;
    private int intervalMinutes;
    private Integer placementIntervalMinutes;
    private Map<TalkPlanning.TalkType, TalkTypeConfig> talkTypes = new EnumMap<>(TalkPlanning.TalkType.class);
    private List<TimelineDay> days = new ArrayList<>();
    private List<TimelineRoom> rooms = new ArrayList<>();
}
