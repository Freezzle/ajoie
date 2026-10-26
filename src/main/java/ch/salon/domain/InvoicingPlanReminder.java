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

    public InvoicingPlanReminder(UUID invoicingPlanId, Instant sentDate) {
        this.invoicingPlanId = invoicingPlanId;
        this.sentDate = sentDate;
    }
}
