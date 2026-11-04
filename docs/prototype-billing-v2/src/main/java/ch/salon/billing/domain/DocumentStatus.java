package ch.salon.billing.domain;

/** Statut de paiement d'une facture. Toujours CALCULÉ à partir des affectations, jamais stocké. */
public enum DocumentStatus {
    OPEN, PARTIALLY_PAID, OVERDUE, PAID
}
