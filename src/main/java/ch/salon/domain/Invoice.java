package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * A Invoice.
 */
@Entity
@Table(name = "invoice")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Invoice implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "amount")
    private Double amount;

    @Column(name = "billing_date")
    private Instant billingDate;

    @Column(name = "payment_mode")
    private String paymentMode;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "stand", "invoices" }, allowSetters = true)
    private Billing billing;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Invoice id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getAmount() {
        return this.amount;
    }

    public Invoice amount(Double amount) {
        this.setAmount(amount);
        return this;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Instant getBillingDate() {
        return this.billingDate;
    }

    public Invoice billingDate(Instant billingDate) {
        this.setBillingDate(billingDate);
        return this;
    }

    public void setBillingDate(Instant billingDate) {
        this.billingDate = billingDate;
    }

    public String getPaymentMode() {
        return this.paymentMode;
    }

    public Invoice paymentMode(String paymentMode) {
        this.setPaymentMode(paymentMode);
        return this;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public Invoice extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Billing getBilling() {
        return this.billing;
    }

    public void setBilling(Billing billing) {
        this.billing = billing;
    }

    public Invoice billing(Billing billing) {
        this.setBilling(billing);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Invoice)) {
            return false;
        }
        return getId() != null && getId().equals(((Invoice) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Invoice{" +
            "id=" + getId() +
            ", amount=" + getAmount() +
            ", billingDate='" + getBillingDate() + "'" +
            ", paymentMode='" + getPaymentMode() + "'" +
            ", extraInformation='" + getExtraInformation() + "'" +
            "}";
    }
}
