package ch.salon.billing.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Montant en CHF, toujours à 2 décimales (arrondi commercial HALF_UP).
 *
 * Remplace les {@code Double} : aucune comparaison à epsilon n'est nécessaire, {@code equals}
 * est fiable car l'échelle est normalisée à 2.
 */
public record Money(BigDecimal amount) implements Comparable<Money> {

    public static final Money ZERO = new Money(BigDecimal.ZERO);
    private static final BigDecimal CASH_UNIT = new BigDecimal("0.05");

    public Money {
        Objects.requireNonNull(amount, "amount");
        amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static Money chf(String value) {
        return new Money(new BigDecimal(value));
    }

    public static Money of(BigDecimal value) {
        return new Money(value);
    }

    public Money plus(Money other) {
        return new Money(amount.add(other.amount));
    }

    public Money minus(Money other) {
        return new Money(amount.subtract(other.amount));
    }

    public Money times(BigDecimal quantity) {
        return new Money(amount.multiply(quantity));
    }

    public Money negate() {
        return new Money(amount.negate());
    }

    public Money abs() {
        return new Money(amount.abs());
    }

    public Money min(Money other) {
        return compareTo(other) <= 0 ? this : other;
    }

    public boolean isZero() {
        return amount.signum() == 0;
    }

    public boolean isPositive() {
        return amount.signum() > 0;
    }

    public boolean isNegative() {
        return amount.signum() < 0;
    }

    /** Arrondi aux 5 centimes, pour les encaissements en espèces. */
    public Money roundToCash() {
        BigDecimal units = amount.divide(CASH_UNIT, 0, RoundingMode.HALF_UP);
        return new Money(units.multiply(CASH_UNIT));
    }

    @Override
    public int compareTo(Money other) {
        return amount.compareTo(other.amount);
    }

    @Override
    public String toString() {
        return amount.toPlainString();
    }
}
