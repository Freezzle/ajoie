package ch.salon.service.dto.volunteer;

/**
 * Demande de renvoi du lien personnel d'inscription bénévole.
 * Répond toujours 200 pour éviter l'énumération d'e-mails.
 */
public record VolunteerResendLinkDTO(String email) {
}
