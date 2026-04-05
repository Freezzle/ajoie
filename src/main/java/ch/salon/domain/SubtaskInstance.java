package ch.salon.domain;

import ch.salon.domain.enumeration.TaskStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "subtask_instance")
@Data
public class SubtaskInstance implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_instance_id", nullable = false)
    private TaskInstance taskInstance;

    @NotNull
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;

    /** Description libre de la sous-tâche. */
    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** Masquer cette sous-tâche jusqu'à cette date. */
    @Column(name = "snoozed_until")
    private LocalDate snoozedUntil;

    /** Responsable de cette sous-tâche (optionnel, nom libre). */
    @Column(name = "responsible", length = 255)
    private String responsible;

    /** Informations fournisseur liées à cette sous-tâche (optionnel, texte libre). */
    @Column(name = "supplier_info", columnDefinition = "text")
    private String supplierInfo;

    /**
     * Type de saisie pour la date d'échéance : 'FIXED' = date fixe, 'OFFSET' = J±N.
     * Défaut FIXED pour rétrocompatibilité.
     */
    @Column(name = "due_date_type", nullable = false, length = 10)
    private String dueDateType = "FIXED";

    /**
     * Décalage en jours par rapport à salon.startingDate.
     * Null si dueDateType = 'FIXED'.
     * Ex : -14 = J-14, +3 = J+3.
     */
    @Column(name = "due_date_offset")
    private Integer dueDateOffset;

    /**
     * Type de saisie pour snoozedUntil : 'FIXED' | 'OFFSET'. Null = pas de snooze.
     */
    @Column(name = "snooze_until_type", length = 10)
    private String snoozeUntilType;

    /**
     * Décalage en jours par rapport à salon.startingDate pour le snooze.
     * Null si snoozeUntilType = 'FIXED' ou absent.
     */
    @Column(name = "snooze_offset")
    private Integer snoozeOffset;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
