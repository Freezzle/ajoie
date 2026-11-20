package ch.salon.service.dto;

import ch.salon.domain.enumeration.Status;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** Salon où le doublon et la cible ont chacun une participation active : la fusion créerait un client en double. */
@Data
public class DuplicateMergeConflictDTO {
    private UUID salonId;
    private String salonPlace;
    private Instant salonStartingDate;
    private UUID duplicateParticipationId;
    private String duplicateClientNumber;
    private Status duplicateStatus;
    private UUID targetParticipationId;
    private String targetClientNumber;
    private Status targetStatus;
}
