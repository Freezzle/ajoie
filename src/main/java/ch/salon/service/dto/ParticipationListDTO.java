package ch.salon.service.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * Participation enrichie pour la liste d'un salon : on y ajoute les compteurs de
 * prestations et de factures, pour que le pied de chaque ligne soit affichable
 * sans requête supplémentaire.
 *
 * <p>Les prestations écartées (refusées et annulées) sont exclues des compteurs.</p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ParticipationListDTO extends ParticipationDTO implements Serializable {

    private long nbStands = 0L;
    private long nbSharedStands = 0L;
    private long nbConferences = 0L;
    private long nbWorkshops = 0L;

    private long nbDraft = 0L;
    private long nbIssued = 0L;
    private long nbPaid = 0L;
    private long nbExpired = 0L;
}
