package ch.salon.billing.domain;

import java.time.LocalDate;

/**
 * Affectation d'une source d'argent (paiement ou note de crédit) à une cible (facture ou
 * remboursement).
 */
public record Allocation(String sourceId, String target, Money amount, LocalDate date) {
}
