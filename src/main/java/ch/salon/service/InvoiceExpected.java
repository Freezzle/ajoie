package ch.salon.service;

import ch.salon.domain.enumeration.Type;

import java.util.UUID;

public class InvoiceExpected {
    private final Type type;
    private final UUID referenceId;
    private final String label;
    private final long quantity;
    private final double unitPrice;

    public InvoiceExpected(Type type, UUID referenceId, String label, long quantity, double unitPrice) {
        this.type = type;
        this.referenceId = referenceId;
        this.label = label;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Type getType() {
        return type;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public String getLabel() {
        return label;
    }

    public long getQuantity() {
        return quantity;
    }

    public double getUnitPrice() {
        return unitPrice;
    }

    public double getExpectedTotal() {
        return unitPrice * quantity;
    }
}
