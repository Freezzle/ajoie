package ch.salon.service.dto;

import ch.salon.domain.enumeration.Mode;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

public class PaymentDTO implements Serializable {

    private UUID id;
    private Double amount;
    private Instant billingDate;
    private Mode paymentMode;
    private String extraInformation;

    private ParticipationLightDTO participation;

    public PaymentDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Instant getBillingDate() {
        return billingDate;
    }

    public void setBillingDate(Instant billingDate) {
        this.billingDate = billingDate;
    }

    public Mode getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(Mode paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getExtraInformation() {
        return extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public ParticipationLightDTO getParticipation() {
        return participation;
    }

    public void setParticipation(ParticipationLightDTO participation) {
        this.participation = participation;
    }
}
