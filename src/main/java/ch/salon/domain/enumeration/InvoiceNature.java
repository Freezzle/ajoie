package ch.salon.domain.enumeration;

/**
 * Nature métier d'une ligne de facture.
 * <p>
 * Le signe du montant ne suffit pas à qualifier une ligne négative : une annulation de ligne
 * (changement de dimension de stand, prestation retirée après envoi) n'est pas un geste
 * commercial et ne doit donc pas gonfler le total des réductions dans les statistiques.
 */
public enum InvoiceNature {
    /** Prestation facturée, montant positif. */
    SERVICE,
    /** Rabais offert à l'exposant, montant négatif, comptabilisé dans les réductions. */
    REDUCTION,
    /** Annulation / rectification d'une ligne déjà facturée, montant négatif, hors réductions. */
    CORRECTION
}
