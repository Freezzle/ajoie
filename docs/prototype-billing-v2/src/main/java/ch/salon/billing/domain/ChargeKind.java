package ch.salon.billing.domain;

/** Nature d'un poste : sert aux statistiques (réductions) et à l'export comptable. */
public enum ChargeKind {
    /** Prestation vendue (stand, repas, électricité…). */
    SERVICE,
    /** Geste commercial : prix négatif. */
    DISCOUNT,
    /** Frais (port, rappel…). */
    FEE
}
