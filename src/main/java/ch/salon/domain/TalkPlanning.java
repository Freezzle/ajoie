package ch.salon.domain;

import lombok.Data;

@Data
public class TalkPlanning {
    public enum TalkType { WORKSHOP, CONFERENCE }

    private String id;
    private TalkType type;
    private int durationTotalMinutes;
    private int durationTalkMinutes;
    private String roomId;
    private String dayId;
    private int startSlot;
}
