package ch.salon.billing.application;

import ch.salon.billing.domain.Money;

import java.time.LocalDate;

/** Une écriture de crédit lue dans un avis bancaire camt.054. */
public record BankNotification(String bankReference, LocalDate bookingDate, Money amount, String creditorReference) {
}
