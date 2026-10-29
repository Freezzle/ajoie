package ch.salon.domain;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Disponibilité d'un bénévole pour un jour du planning.
 * available=false → ranges vide (le bénévole ne vient pas ce jour-là).
 */
@Data
public class VolunteerAvailabilityDay {
    private String dayId;
    private boolean available;
    private List<VolunteerTimeRange> ranges = new ArrayList<>();
}
