package ch.salon.service;

import ch.salon.domain.enumeration.Type;

import java.util.List;

/**
 * Estimation en lecture seule du coût d'une participation, telle qu'affichée dans le récapitulatif
 * d'inscription (PDF). Les montants restent indicatifs : seule la facture fait foi.
 */
public record InvoiceEstimate(List<Line> lines, double total) {

    public record Line(Type type, String label, long quantity, double unitPrice, double amount) {
    }

    public boolean isEmpty() {
        return lines.isEmpty();
    }
}
