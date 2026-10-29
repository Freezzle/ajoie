package ch.salon.domain;

import lombok.Data;

/**
 * Plage horaire d'une disponibilité bénévole, exprimée en "HH:mm".
 */
@Data
public class VolunteerTimeRange {
    private String start;
    private String end;
}
