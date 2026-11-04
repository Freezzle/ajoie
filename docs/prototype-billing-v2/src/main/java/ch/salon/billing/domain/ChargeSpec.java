package ch.salon.billing.domain;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;

/**
 * Un poste que l'appelant (ex. les participations) veut voir facturé.
 *
 * L'appelant envoie toujours la liste COMPLÈTE de ce qui doit être facturé pour un dossier ;
 * la facturation compare avec ce qu'elle a déjà et produit les écarts. Elle ne connaît rien du
 * métier : la clé, le groupe et la catégorie sont choisis par l'appelant.
 *
 * @param key       identifiant stable du poste chez l'appelant (ex. "stand:{id}", "meal:1")
 * @param label     libellé imprimé
 * @param quantity  quantité attendue, strictement positive (un poste à 0 = on ne l'envoie pas)
 * @param unitPrice prix unitaire facturé
 * @param listPrice prix catalogue (sert à mesurer les gestes commerciaux)
 * @param kind      prestation, réduction ou frais
 * @param group     regroupement en documents choisi par l'appelant (ex. "main", "meals")
 * @param category  catégorie pour les statistiques / l'export comptable
 * @param attributes informations complémentaires ; si elles changent, la prestation est considérée
 *                  comme différente (annulation + nouvelle ligne)
 */
public record ChargeSpec(String key, String label, BigDecimal quantity, Money unitPrice, Money listPrice,
                         ChargeKind kind, String group, String category, Map<String, String> attributes) {

    public ChargeSpec {
        requireText(key, "key");
        requireText(label, "label");
        requireText(group, "group");
        Objects.requireNonNull(quantity, "quantity");
        Objects.requireNonNull(unitPrice, "unitPrice");
        if (quantity.signum() <= 0) {
            throw new IllegalArgumentException("La quantité du poste '" + key + "' doit être > 0 (ne pas envoyer un poste à 0)");
        }
        kind = kind == null ? ChargeKind.SERVICE : kind;
        if (kind == ChargeKind.DISCOUNT && unitPrice.isPositive()) {
            throw new IllegalArgumentException("Une réduction doit avoir un prix négatif ou nul : " + key);
        }
        if (kind != ChargeKind.DISCOUNT && unitPrice.isNegative()) {
            throw new IllegalArgumentException("Un prix négatif n'est permis que pour une réduction : " + key);
        }
        listPrice = listPrice == null ? unitPrice : listPrice;
        category = category == null || category.isBlank() ? group : category;
        attributes = attributes == null ? Map.of() : Map.copyOf(new TreeMap<>(attributes));
    }

    /** Ce qui identifie « la même prestation » : tout sauf la quantité et le prix catalogue. */
    public Variant variant() {
        return new Variant(label, unitPrice, group, kind, category, attributes);
    }

    public Money amount() {
        return unitPrice.times(quantity);
    }

    public static Builder charge(String key, String label) {
        return new Builder(key, label);
    }

    private static void requireText(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " est obligatoire");
        }
    }

    public static final class Builder {
        private final String key;
        private final String label;
        private BigDecimal quantity = BigDecimal.ONE;
        private Money unitPrice;
        private Money listPrice;
        private ChargeKind kind = ChargeKind.SERVICE;
        private String group = "main";
        private String category;
        private final Map<String, String> attributes = new TreeMap<>();

        private Builder(String key, String label) {
            this.key = key;
            this.label = label;
        }

        public Builder quantity(long quantity) {
            this.quantity = BigDecimal.valueOf(quantity);
            return this;
        }

        public Builder price(String unitPrice) {
            this.unitPrice = Money.chf(unitPrice);
            return this;
        }

        public Builder listPrice(String listPrice) {
            this.listPrice = Money.chf(listPrice);
            return this;
        }

        public Builder kind(ChargeKind kind) {
            this.kind = kind;
            return this;
        }

        public Builder group(String group) {
            this.group = group;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder attribute(String name, String value) {
            this.attributes.put(name, value);
            return this;
        }

        public ChargeSpec build() {
            return new ChargeSpec(key, label, quantity, unitPrice, listPrice, kind, group, category, attributes);
        }
    }
}
