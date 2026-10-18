package ch.salon.service.dto.registration;

import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Informations publiques d'un salon, nécessaires au formulaire d'inscription.
 * Aucun prix, aucune coordonnée bancaire, aucune information interne.
 */
@Data
public class PublicSalonInfoDTO implements Serializable {

    private UUID id;
    private String place;
    private Instant startingDate;
    private Instant endingDate;

    /**
     * true si les inscriptions sont ouvertes maintenant (flag activé et date courante dans la plage).
     */
    private boolean registrationOpen;

    private Instant registrationOpeningDate;
    private Instant registrationClosingDate;

    /**
     * Titre et texte d'accueil affichés avant le début du formulaire d'inscription (première inscription uniquement).
     */
    private String registrationWelcomeTitle;
    private String registrationWelcomeText;

    /**
     * Raison de fermeture : {@code DISABLED}, {@code NOT_YET_OPEN} ou {@code CLOSED}. Null si ouvert.
     */
    private String closedReason;

    private List<PublicDimensionDTO> dimensions = new ArrayList<>();

    /** Prix du salon, pour l'estimation du coût de l'inscription. */
    private PublicPricesDTO prices = new PublicPricesDTO();
}
