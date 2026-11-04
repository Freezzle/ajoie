package ch.salon.billing.domain;

import java.time.LocalDate;

/**
 * Argent reçu (montant > 0). Il n'appartient pas à un document : il est AFFECTÉ à un ou plusieurs
 * documents du dossier ; le surplus reste un avoir du dossier.
 *
 * @param bankReference identifiant de la transaction bancaire (camt.054) : un import en double
 *                      est ignoré
 * @param targetDocument document visé (via la référence QR), affecté en priorité s'il est ouvert
 */
public record Payment(String id, LocalDate date, Money amount, PaymentMode mode, String bankReference,
                      String targetDocument) {
}
