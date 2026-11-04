package ch.salon.billing.domain;

import java.util.Objects;

/**
 * Référence GÉNÉRIQUE de ce qui est facturé : un type et un identifiant chez l'appelant.
 * La facturation ne connaît pas les participations : elle connaît ("PARTICIPATION", "uuid"),
 * et demain ("SPONSORING", "…"), ("MEMBERSHIP", "…"), etc. Les événements publiés portent cette
 * référence : chaque module n'écoute que son type.
 */
public record SourceRef(String type, String id) {

    public SourceRef {
        if (type == null || type.isBlank() || id == null || id.isBlank()) {
            throw new IllegalArgumentException("type et id sont obligatoires");
        }
        type = type.trim().toUpperCase(java.util.Locale.ROOT);
    }

    public static SourceRef of(String type, String id) {
        return new SourceRef(type, id);
    }

    public boolean is(String expectedType) {
        return Objects.equals(type, expectedType);
    }

    @Override
    public String toString() {
        return type + ":" + id;
    }
}
