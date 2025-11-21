package ch.salon.domain;

import lombok.Data;

import java.time.Instant;

@Data
public class TimelineRoomData {
    private String roomId;
    private Instant startingHour;
    private Instant endingHour;
}
