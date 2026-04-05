package ch.salon.service.dto;

import ch.salon.domain.enumeration.TaskStatus;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class SubtaskInstanceDTO implements Serializable {

    private UUID id;
    private UUID taskInstanceId;
    private String title;
    private TaskStatus status;
    private LocalDate dueDate;
    private Instant completedAt;
    private Integer sortOrder;
    /** Description libre (point 4). */
    private String description;
    /** Date de snooze calculée (stockée en base). */
    private LocalDate snoozedUntil;
    /** Responsable (optionnel). */
    private String responsible;
    /** Informations fournisseur (optionnel). */
    private String supplierInfo;
    /** Type de saisie pour dueDate : 'FIXED' | 'OFFSET'. */
    private String dueDateType = "FIXED";
    /** Décalage en jours (J±N) utilisé si dueDateType = 'OFFSET'. */
    private Integer dueDateOffset;
    /** Type de saisie pour snoozedUntil : 'FIXED' | 'OFFSET'. Null = pas de snooze. */
    private String snoozeUntilType;
    /** Décalage en jours pour le snooze si snoozeUntilType = 'OFFSET'. */
    private Integer snoozeOffset;
}
