package ch.salon.domain.enumeration;

/**
 * Statut d'une inscription bénévole publique.
 * ACTIVE : inscription en cours de validité.
 * CANCELLED : le bénévole s'est désinscrit (réversible via son lien).
 * REMOVED : l'organisateur a retiré l'inscription depuis le planning admin.
 */
public enum VolunteerRegistrationStatus {
    ACTIVE, CANCELLED, REMOVED
}
