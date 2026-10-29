package ch.salon.service.dto.volunteer;

import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Informations publiques d'un salon pour le parcours d'inscription bénévole.
 * DTO dédié : n'expose jamais les besoins, affectations ou nombre d'inscrits du planning.
 */
@Data
public class PublicVolunteerSalonInfoDTO {

    private String id;
    private String place;
    private Instant startingDate;
    private Instant endingDate;
    private boolean registrationOpen;
    /** DISABLED | NOT_YET_OPEN | CLOSED | null */
    private String closedReason;
    private Instant registrationClosingDate;
    private String welcomeTitle;
    private String welcomeText;
    private List<Day> days = new ArrayList<>();
    private List<Zone> zones = new ArrayList<>();

    @Data
    public static class Day {
        private String id;
        private String label;
        private String date;
        private String description;
        private String startTime;
        private String endTime;
    }

    @Data
    public static class Zone {
        private String id;
        private String label;
        private String color;
        private String icon;
        private String description;
        private List<String> dayIds = new ArrayList<>();
    }
}
