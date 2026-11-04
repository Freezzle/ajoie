package ch.salon.billing.domain;

import java.math.BigDecimal;
import java.util.List;

/** Ligne figée d'un document émis : copie de la ligne « à facturer » au moment de l'émission. */
public record DocumentLine(int position, String key, Variant variant, String displayLabel, BigDecimal quantity,
                           Money amount, Money listPrice, LineType type, List<String> corrects) {

    public DocumentLine {
        corrects = List.copyOf(corrects);
    }

    static DocumentLine from(int position, PendingLine line) {
        return new DocumentLine(position, line.key(), line.variant(), line.displayLabel(), line.quantity(),
                line.amount(), line.listPrice(), line.type(), line.corrects());
    }

    public Money unitPrice() {
        return variant.unitPrice();
    }
}
