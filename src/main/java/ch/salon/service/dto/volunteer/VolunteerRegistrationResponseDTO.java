package ch.salon.service.dto.volunteer;

/**
 * Réponse minimale après création d'une inscription bénévole.
 */
public record VolunteerRegistrationResponseDTO(String registrationId, String firstName, String email) {
}
