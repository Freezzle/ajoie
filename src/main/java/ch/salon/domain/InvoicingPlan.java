package ch.salon.domain;

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
import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "invoicing_plan")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class InvoicingPlan implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "generation_date")
    private Instant generationDate = Instant.now();

    @Column(name = "billing_number", nullable = false)
    private String billingNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "state")
    private State state = State.CURRENT;

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL)
    @JoinColumn(name = "invoicing_plan_id", referencedColumnName = "id")
    @OrderBy("position ASC")
    private Set<Invoice> invoices = new HashSet<>();

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL)
    @JoinColumn(name = "invoicing_plan_id", referencedColumnName = "id")
    @OrderBy("billingDate ASC")
    private Set<Payment> payments = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties(value = { "exhibitor", "salon" }, allowSetters = true)
    private Participation participation;

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public InvoicingPlan id(UUID id) {
        this.setId(id);
        return this;
    }

    public Instant getGenerationDate() {
        return this.generationDate;
    }

    public void setGenerationDate(Instant generationDate) {
        this.generationDate = generationDate;
    }

    public InvoicingPlan generationDate(Instant generationDate) {
        this.setGenerationDate(generationDate);
        return this;
    }

    public Participation getParticipation() {
        return this.participation;
    }

    public void setParticipation(Participation participation) {
        this.participation = participation;
    }

    public InvoicingPlan participation(Participation participation) {
        this.setParticipation(participation);
        return this;
    }

    public String getBillingNumber() {
        return billingNumber;
    }

    public void setBillingNumber(String billingNumber) {
        this.billingNumber = billingNumber;
    }

    public Set<Invoice> getInvoices() {
        return this.invoices;
    }

    public void setInvoices(Set<Invoice> invoices) {
        this.invoices = invoices;
    }

    public InvoicingPlan invoices(Set<Invoice> invoices) {
        this.setInvoices(invoices);
        return this;
    }

    public InvoicingPlan addInvoice(Invoice invoice) {
        this.invoices.add(invoice);
        return this;
    }

    public InvoicingPlan removeInvoice(Invoice invoice) {
        this.invoices.remove(invoice);
        return this;
    }

    public Set<Payment> getPayments() {
        return payments;
    }

    public void setPayments(Set<Payment> payments) {
        this.payments = payments;
    }

    public InvoicingPlan addPayment(Payment payment) {
        this.payments.add(payment);
        return this;
    }

    public InvoicingPlan removePayment(Payment payment) {
        this.payments.remove(payment);
        return this;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public Double getInvoicesTotal() {
        return getInvoices().stream().map(Invoice::getTotalAmount).reduce(0.00, Double::sum);
    }

    public Double getPaymentsTotal() {
        return getPayments().stream().map(Payment::getAmount).reduce(0.00, Double::sum);
    }

    public Double getTotal() {
        return getInvoicesTotal() + getPaymentsTotal();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof InvoicingPlan)) {
            return false;
        }
        return getId() != null && getId().equals(((InvoicingPlan) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return (
            "InvoicingPlan{" +
            "id=" +
            id +
            ", generationDate=" +
            generationDate +
            ", billingNumber='" +
            billingNumber +
            '\'' +
            ", state=" +
            state +
            '}'
        );
    }
}
