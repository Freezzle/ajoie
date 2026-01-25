package ch.salon.domain;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "invoicing_plan")
@Data
public class InvoicingPlan implements Serializable {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "generation_date")
    private Instant generationDate = Instant.now();

    @Column(name = "issued_date")
    private Instant issuedDate;

    @Column(name = "expiration_date")
    private Instant expirationDate;

    @Column(name = "billing_number", nullable = false)
    private String billingNumber;

    @Column(name = "need_arrangement")
    private Boolean needArrangement = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_sending_method")
    private InvoiceSendingMethod invoiceSendingMethod = InvoiceSendingMethod.EMAIL;

    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private State state = State.DRAFT;

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL)
    @JoinColumn(name = "invoicing_plan_id", referencedColumnName = "id")
    @OrderBy("position ASC")
    private Set<Invoice> invoices = new HashSet<>();

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL)
    @JoinColumn(name = "invoicing_plan_id", referencedColumnName = "id")
    @OrderBy("billingDate ASC")
    private Set<Payment> payments = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties(value = {"exhibitor", "salon"}, allowSetters = true)
    private Participation participation;

    public Double getInvoicesTotal() {
        return getInvoices().stream().map(Invoice::getTotalAmount).reduce(0.00, Double::sum);
    }

    public Double getInvoicesDefaultTotal() {
        return getInvoices().stream().filter(i -> !i.isReduction()).map(Invoice::getTotalDefaultAmount)
                            .reduce(0.00, Double::sum);
    }

    public Double getPaymentTotal() {
        return this.getPayments().stream().map(Payment::getAmount).reduce(Double::sum).orElse(0.00);
    }

    public Double getPaymentsTotal() {
        return getPayments().stream().map(Payment::getAmount).reduce(0.00, Double::sum);
    }

    public Double getReductionsTotal() {
        Double totalDiscount =
                getInvoices().stream().filter(Invoice::isReduction).map(Invoice::getTotalAmount).map(Math::abs)
                             .reduce(0.00, Double::sum);

        Double totalDiff = getInvoices().stream().filter(Invoice::hasDifference).filter(in -> !in.isReduction())
                                        .map(Invoice::getTotalDifference).map(Math::abs).reduce(0.00, Double::sum);

        return totalDiscount + totalDiff;
    }

    public Double getTotal() {
        return getInvoicesTotal() - getPaymentsTotal();
    }

    public static Instant calculateExpirationDate(InvoicingPlan invoicingPlan) {
        if (invoicingPlan.getNeedArrangement()) {
            return invoicingPlan.getParticipation().getSalon().getEndingDate();
        }

        LocalDateTime fixedExpirationDate =
                LocalDateTime.ofInstant(invoicingPlan.getParticipation().getSalon().getEndingDate(), ZoneOffset.UTC);
        LocalDateTime deadline = fixedExpirationDate.minusDays(30);

        if (LocalDateTime.now().isAfter(deadline)) {
            return invoicingPlan.getParticipation().getSalon().getEndingDate();
        } else {
            return LocalDateTime.now().plusDays(30).toInstant(ZoneOffset.UTC);
        }
    }
}
