package ch.salon.billing.domain;

import java.math.BigInteger;
import java.util.Locale;

/**
 * Référence créancier ISO 11649 (« RF… »), utilisable dans la QR-facture avec un IBAN normal.
 * Elle permet de rapprocher automatiquement un paiement (camt.054) du document payé.
 */
public final class CreditorReference {

    private CreditorReference() {
    }

    /** Ex. "F-2027-0001" → "RF..F20270001". */
    public static String fromDocumentNumber(String documentNumber) {
        String reference = documentNumber.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        if (reference.isEmpty() || reference.length() > 21) {
            throw new IllegalArgumentException("Référence invalide : " + documentNumber);
        }
        int check = 98 - mod97(reference + "RF00");
        return "RF" + String.format("%02d", check) + reference;
    }

    public static boolean isValid(String creditorReference) {
        String ref = creditorReference.replace(" ", "").toUpperCase(Locale.ROOT);
        if (!ref.startsWith("RF") || ref.length() < 5 || ref.length() > 25) {
            return false;
        }
        return mod97(ref.substring(4) + ref.substring(0, 4)) == 1;
    }

    private static int mod97(String alphanumeric) {
        StringBuilder digits = new StringBuilder();
        for (char c : alphanumeric.toCharArray()) {
            digits.append(Character.isDigit(c) ? String.valueOf(c) : String.valueOf(c - 'A' + 10));
        }
        return new BigInteger(digits.toString()).mod(BigInteger.valueOf(97)).intValue();
    }
}
