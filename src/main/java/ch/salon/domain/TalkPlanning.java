package ch.salon.domain;

import lombok.Data;

import java.time.Instant;

@Data
public class TalkPlanning {
    public enum TalkType { WORKSHOP, CONFERENCE }

    private String id;
    private TalkType type;
    private int durationTotalMinutes;
    private int durationTalkMinutes;
    private int preparationMinutes;
    private int cleanupMinutes;
    private String roomId;
    private String dayId;
    private Instant startingHour;

    /**
     * @deprecated remplacé par {@link #startingHour}. Encore lu pour la reprise des plannings
     * enregistrés avant la refonte, mais plus écrit par le front.
     */
    @Deprecated
    private Integer startSlot;
}
