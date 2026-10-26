package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Rappel de paiement envoyé pour un plan de facturation.
 * <p>
 * Le lien vers le plan est une simple colonne : la frise de la facture a besoin des dates de
 * rappel de tous les plans d'un salon, chargées en une requête, et non d'une collection
 * supplémentaire montée en EAGER sur {@link InvoicingPlan}.
 */
@Entity
@Table(name = "invoicing_plan_reminder")
@Data
@NoArgsConstructor
public class InvoicingPlanReminder implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "invoicing_plan_id", nullable = false)
    private UUID invoicingPlanId;

    @NotNull
    @Column(name = "sent_date", nullable = false)
    private Instant sentDate;

    /**
     * Échéance du plan au moment de l'envoi du rappel.
     * <p>
     * L'échéance de la facture est souvent repoussée après une relance : sans ce cliché, la frise
     * ne permettrait plus de savoir combien de jours après l'échéance le rappel a été envoyé.
     * Nulle pour les rappels antérieurs à cette colonne.
     */
    @Column(name = "due_date_at_send")
    private Instant dueDateAtSend;

    public InvoicingPlanReminder(UUID invoicingPlanId, Instant sentDate, Instant dueDateAtSend) {
        this.invoicingPlanId = invoicingPlanId;
        this.sentDate = sentDate;
        this.dueDateAtSend = dueDateAtSend;
    }
}
