package ch.salon.domain;

import ch.salon.domain.enumeration.Mode;
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
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment")
@Data
@NoArgsConstructor
public class Payment implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "amount", nullable = false)
    private Double amount;

    @NotNull
    @Column(name = "billing_date", nullable = false)
    private Instant billingDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode")
    private Mode paymentMode;

    @Column(name = "extra_information")
    private String extraInformation;

    public Payment(Payment payment) {
        this.id = null;
        this.amount = payment.getAmount();
        this.billingDate = payment.getBillingDate();
        this.paymentMode = payment.getPaymentMode();
        this.extraInformation = payment.getExtraInformation();
    }
}
