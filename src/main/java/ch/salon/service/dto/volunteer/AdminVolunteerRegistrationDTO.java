package ch.salon.service.dto.volunteer;

import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Détail d'une inscription bénévole affiché dans la popin admin (planning). Contient toutes les
 * informations transmises par le bénévole en ligne.
 */
@Data
public class AdminVolunteerRegistrationDTO {

    private String id;
    private String planningVolunteerId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    /** ANY | CHOOSE */
    private String zoneMode;
    private List<String> categoryIds = new ArrayList<>();
    private String notes;
    private List<AvailabilityDay> availability = new ArrayList<>();
    /** ACTIVE | CANCELLED | REMOVED */
    private String status;
    private Instant registrationDate;

    @Data
    public static class AvailabilityDay {
        private String dayId;
        private boolean available;
        private List<TimeRange> ranges = new ArrayList<>();
    }

    @Data
    public static class TimeRange {
        private String start;
        private String end;
    }
}
