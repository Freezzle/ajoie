package ch.salon.billing.domain;

import java.math.BigDecimal;
import java.util.List;

/**
 * Ligne « à facturer » : écart entre ce que l'appelant attend et ce qui est déjà facturé.
 * Elle n'est pas stockée : elle est recalculée à chaque lecture, ce qui rend la synchronisation
 * idempotente par construction.
 */
public record PendingLine(String key, Variant variant, BigDecimal quantity, Money listPrice, LineType type,
                          List<String> corrects) {

    public PendingLine {
        corrects = List.copyOf(corrects);
    }

    public Money amount() {
        return variant.unitPrice().times(quantity);
    }

    public String group() {
        return variant.group();
    }

    /** Libellé imprimé : explicite pour l'exposant sur ce qui est annulé ou corrigé. */
    public String displayLabel() {
        String refs = corrects.isEmpty() ? "" : " (" + String.join(", ", corrects) + ")";
        return switch (type) {
            case NEW -> variant.label();
            case ADJUSTMENT -> variant.label() + " – modification de quantité" + refs;
            case REVERSAL -> "Annulation : " + variant.label() + refs;
            case DEPOSIT, DEPOSIT_DEDUCTION -> variant.label();
        };
    }
}
