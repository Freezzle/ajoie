package ch.salon.service;

import ch.salon.domain.enumeration.Type;

import java.util.Objects;
import java.util.UUID;

public class InvoiceKey {

    private final Type type;
    private final UUID referenceId;

    public InvoiceKey(Type type, UUID referenceId) {
        this.type = type;
        this.referenceId = referenceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof InvoiceKey that)) return false;
        return type == that.type && Objects.equals(referenceId, that.referenceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(type, referenceId);
    }

    public Type getType() {
        return type;
    }

    public UUID getReferenceId() {
        return referenceId;
    }
}
