package ch.salon.billing.domain;

import java.time.LocalDate;

/** Remboursement au débiteur d'un avoir du dossier. */
public record Refund(String id, LocalDate date, Money amount, String reason) {
}
