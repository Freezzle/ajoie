package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class PaymentLightDTO implements Serializable {

    private UUID id;
    private Double amount;

    public PaymentLightDTO() {
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
}
