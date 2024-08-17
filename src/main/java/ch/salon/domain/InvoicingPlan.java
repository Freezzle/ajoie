package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A Invoice.
 */
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
    private Instant generationDate;

    @Column(name = "billing_number", nullable = false)
    private String billingNumber;

    @Column(name = "has_been_sent", nullable = false)
    private boolean hasBeenSent = false;

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL)
    @JoinColumn(name = "invoicing_plan_id", referencedColumnName = "id")
    @OrderBy("position ASC")
    private Set<Invoice> invoices = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties(value = { "exhibitor", "salon" }, allowSetters = true)
    private Participation participation;

    // jhipster-needle-entity-add-field - JHipster will add fields here

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

    public boolean isHasBeenSent() {
        return hasBeenSent;
    }

    public void setHasBeenSent(boolean hasBeenSent) {
        this.hasBeenSent = hasBeenSent;
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

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

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

    // prettier-ignore
    @Override
    public String toString() {
        return "Invoice{" + "id=" + getId() + ", generationDate='" + getGenerationDate() + "'" + ", billingNumber=" +
               getBillingNumber() + ", hasBeenSent='" + isHasBeenSent() + "'" + "}";
    }
}
