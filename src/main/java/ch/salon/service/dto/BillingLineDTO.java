package ch.salon.service.dto;

import java.io.Serializable;

public class BillingLineDTO implements Serializable {

    private String label;
    private Double amount;

    public BillingLineDTO(String label, Double amount) {
        this.label = label;
        this.amount = amount;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }
}
