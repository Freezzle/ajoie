package ch.salon.service;

import ch.salon.domain.enumeration.Type;

import java.util.UUID;

public record InvoiceExpected(Type type, UUID referenceId, String label, long quantity, double unitPrice) {
    public double getExpectedTotal() {
        return unitPrice * quantity;
    }
}
