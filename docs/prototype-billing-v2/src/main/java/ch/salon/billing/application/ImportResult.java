package ch.salon.billing.application;

import java.util.List;

/** Bilan d'un import bancaire : ce qui a été rapproché, ignoré (doublon) ou reste à traiter à la main. */
public record ImportResult(List<BankNotification> matched, List<BankNotification> duplicates,
                           List<BankNotification> unmatched) {
}
