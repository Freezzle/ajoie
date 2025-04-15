package ch.salon.web.rest.dto;

import java.io.Serializable;

public class FacturationStats implements Serializable {

    private Double paid = 0.00;
    private Double discount = 0.00;
    private Double remaining = 0.00;
    private Double expected = 0.00;
    private Double total = 0.00;

    public Double getPaid() {
        return paid;
    }

    public void setPaid(Double paid) {
        this.paid = paid;
    }

    public Double getDiscount() {
        return discount;
    }

    public void setDiscount(Double discount) {
        this.discount = discount;
    }

    public Double getExpected() {
        return expected;
    }

    public void setExpected(Double expected) {
        this.expected = expected;
    }

    public Double getRemaining() {
        return remaining;
    }

    public void setRemaining(Double remaining) {
        this.remaining = remaining;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }
}

