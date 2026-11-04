package ch.salon.billing.domain;

/** Origine d'une ligne de document. */
public enum LineType {
    /** Première facturation du poste. */
    NEW,
    /** Variation de quantité d'un poste déjà facturé (même variante). */
    ADJUSTMENT,
    /** Annulation d'une ligne déjà facturée (poste retiré ou prestation modifiée). */
    REVERSAL,
    /** Ligne d'une facture d'acompte, ou de son annulation (montant négatif dans une note de crédit). */
    DEPOSIT,
    /** Déduction d'un acompte encaissé, sur une facture. */
    DEPOSIT_DEDUCTION;

    /** Les lignes d'acompte ne sont pas des prestations : elles n'entrent pas dans « déjà facturé ». */
    public boolean isCharge() {
        return this == NEW || this == ADJUSTMENT || this == REVERSAL;
    }
}
