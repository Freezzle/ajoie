package ch.salon.billing.domain;

/**
 * Débiteur, avec une adresse STRUCTURÉE (exigée par la QR-facture v2.3 : adresse de type S).
 * Une copie est figée dans chaque document à l'émission.
 */
public record Debtor(String name, String street, String houseNumber, String postalCode, String city,
                     String country, String language) {

    /** Nom, localité et pays sont le minimum exigé par la QR-facture. */
    public void requireIssuable() {
        if (isBlank(name) || isBlank(city) || isBlank(country)) {
            throw new IllegalStateException(
                    "Adresse du débiteur incomplète (nom, localité et pays obligatoires) : émission impossible");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
