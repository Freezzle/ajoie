package ch.salon.service.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.Instant;

/**
 * Client enrichi pour l'annuaire : nombre de participations et dernier salon,
 * pour que le pied de chaque ligne soit affichable sans requête supplémentaire.
 *
 * <p>Les participations écartées (refusées et annulées) sont exclues.</p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ExhibitorListDTO extends ExhibitorDTO implements Serializable {

    private long nbParticipations = 0L;
    private String lastSalonPlace;
    private Instant lastSalonDate;
}
