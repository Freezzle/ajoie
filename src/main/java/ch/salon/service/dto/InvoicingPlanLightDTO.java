package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class InvoicingPlanLightDTO implements Serializable {

    private UUID id;
    private String billingNumber;

    public InvoicingPlanLightDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getBillingNumber() {
        return billingNumber;
    }

    public void setBillingNumber(String billingNumber) {
        this.billingNumber = billingNumber;
    }
}
