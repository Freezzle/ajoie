package ch.salon.billing.domain;

/**
 * Type de document émis. Le type est déduit du signe du total à l'émission : l'appelant n'a pas
 * à choisir entre facture et note de crédit.
 * Exception : la facture d'acompte (DEPOSIT) est demandée explicitement.
 */
public enum DocumentKind {
    INVOICE("F"),
    /** Facture d'acompte : montant libre, déduit des factures suivantes du même groupe. */
    DEPOSIT("A"),
    CREDIT_NOTE("NC");

    private final String prefix;

    DocumentKind(String prefix) {
        this.prefix = prefix;
    }

    public String prefix() {
        return prefix;
    }
}
