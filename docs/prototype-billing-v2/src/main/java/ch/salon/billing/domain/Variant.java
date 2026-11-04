package ch.salon.billing.domain;

import java.util.Map;

/**
 * Empreinte d'une prestation : deux lignes de même clé et de même variante sont « la même chose »
 * et seule la quantité peut différer. Si la variante change (libellé, prix, groupe, attributs…),
 * la facturation annule la ligne déjà facturée et en crée une nouvelle.
 */
public record Variant(String label, Money unitPrice, String group, ChargeKind kind, String category,
                      Map<String, String> attributes) {
}
