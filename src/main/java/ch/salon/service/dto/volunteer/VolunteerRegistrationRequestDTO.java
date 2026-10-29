package ch.salon.service.dto.volunteer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Charge utile publique d'une inscription bénévole (création et mise à jour complète).
 */
@Data
public class VolunteerRegistrationRequestDTO {

    @Valid
    @NotNull
    private Contact contact = new Contact();

    @Valid
    @NotNull
    private List<AvailabilityDay> availability = new ArrayList<>();

    @Valid
    @NotNull
    private Preferences preferences = new Preferences();

    private boolean acceptContact;

    private String captchaToken;

    @Data
    public static class Contact {
        @NotBlank
        private String firstName;
        @NotBlank
        private String lastName;
        @NotBlank
        @Email
        private String email;
        private String phoneNumber;
    }

    @Data
    public static class AvailabilityDay {
        @NotBlank
        private String dayId;
        private boolean available;
        @Valid
        private List<TimeRange> ranges = new ArrayList<>();
    }

    @Data
    public static class TimeRange {
        @NotBlank
        private String start;
        @NotBlank
        private String end;
    }

    @Data
    public static class Preferences {
        /** ANY | CHOOSE */
        @NotBlank
        private String zoneMode;
        private List<String> categoryIds = new ArrayList<>();
        @Size(max = 500)
        private String notes;
    }
}
