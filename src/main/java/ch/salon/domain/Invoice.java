package ch.salon.domain;

import ch.salon.domain.enumeration.InvoiceNature;
import ch.salon.domain.enumeration.Type;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invoice")
@Data
@NoArgsConstructor
public class Invoice implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "position")
    private Long position;

    @Column(name = "generation_date")
    private Instant generationDate = Instant.now();

    @Column(name = "reference_id")
    private UUID referenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private Type type;

    @Column(name = "label")
    private String label;

    @Column(name = "default_amount")
    private Double defaultAmount;

    @Column(name = "custom_amount")
    private Double customAmount;

    @Column(name = "quantity")
    private Long quantity;

    @Column(name = "lock")
    private Boolean lock;

    @Column(name = "extra_information")
    private String extraInformation;

    @Enumerated(EnumType.STRING)
    @Column(name = "nature", nullable = false)
    private InvoiceNature nature = InvoiceNature.SERVICE;

    public Invoice(Invoice invoice) {
        this.id = null;
        this.position = invoice.position;
        this.generationDate = Instant.now();
        this.referenceId = invoice.getReferenceId();
        this.type = invoice.getType();
        this.label = invoice.getLabel();
        this.quantity = invoice.getQuantity();
        this.defaultAmount = invoice.getDefaultAmount();
        this.customAmount = invoice.getCustomAmount();
        this.lock = invoice.getLock();
        this.extraInformation = invoice.getExtraInformation();
        this.nature = invoice.nature;
    }

    /** Geste commercial : seules ces lignes alimentent le total des réductions. */
    public boolean isReduction() {
        return this.nature == InvoiceNature.REDUCTION;
    }

    /** Annulation d'une ligne déjà facturée : diminue le total attendu sans être une réduction. */
    public boolean isCorrection() {
        return this.nature == InvoiceNature.CORRECTION;
    }

    /**
     * Vrai si le prix facturé s'écarte du prix par défaut.
     *
     * La comparaison passe par {@code compareTo} : {@code BigDecimal.equals} tient compte de
     * l'échelle, et {@code BigDecimal.valueOf(0.0d)} (« 0.0 ») n'est jamais égal à
     * {@link BigDecimal#ZERO} (« 0 ») au sens de {@code equals}.
     */
    public boolean hasDifference() {
        return BigDecimal.valueOf(getDifference()).compareTo(BigDecimal.ZERO) != 0;
    }

    public Double getTotalDifference() {
        return this.quantity * this.getDifference();
    }

    public Double getTotalDefaultAmount() {
        return this.quantity * this.defaultAmount;
    }

    public Double getTotalAmount() {
        return this.quantity * this.customAmount;
    }

    private Double getDifference() {
        return this.defaultAmount - this.customAmount;
    }
}
