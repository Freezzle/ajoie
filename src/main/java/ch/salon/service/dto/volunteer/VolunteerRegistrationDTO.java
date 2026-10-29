package ch.salon.service.dto.volunteer;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;

/**
 * Inscription bénévole renvoyée lors d'une relecture par lien personnel.
 * Ajoute le statut, le droit d'édition et la date de clôture à la charge utile de base.
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class VolunteerRegistrationDTO extends VolunteerRegistrationRequestDTO {

    /** ACTIVE | CANCELLED | REMOVED */
    private String status;
    private boolean editable;
    private Instant registrationClosingDate;
}
