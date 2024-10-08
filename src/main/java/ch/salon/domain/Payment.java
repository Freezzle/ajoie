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
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Payment implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

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

    public Payment() {}

    public Payment(Payment payment) {
        this.amount = payment.getAmount();
        this.billingDate = payment.getBillingDate();
        this.paymentMode = payment.getPaymentMode();
        this.extraInformation = payment.getExtraInformation();
    }

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Payment id(UUID id) {
        this.setId(id);
        return this;
    }

    public Double getAmount() {
        return this.amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Payment amount(Double amount) {
        this.setAmount(amount);
        return this;
    }

    public Instant getBillingDate() {
        return this.billingDate;
    }

    public void setBillingDate(Instant billingDate) {
        this.billingDate = billingDate;
    }

    public Payment billingDate(Instant billingDate) {
        this.setBillingDate(billingDate);
        return this;
    }

    public Mode getPaymentMode() {
        return this.paymentMode;
    }

    public void setPaymentMode(Mode paymentMode) {
        this.paymentMode = paymentMode;
    }

    public Payment paymentMode(Mode paymentMode) {
        this.setPaymentMode(paymentMode);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Payment extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Payment)) {
            return false;
        }
        return getId() != null && getId().equals(((Payment) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return (
            "Payment{" +
            "id=" +
            getId() +
            ", amount=" +
            getAmount() +
            ", billingDate='" +
            getBillingDate() +
            "'" +
            ", paymentMode='" +
            getPaymentMode() +
            "'" +
            ", extraInformation='" +
            getExtraInformation() +
            "'" +
            "}"
        );
    }
}
