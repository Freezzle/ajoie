package ch.salon.billing;

import ch.salon.billing.domain.CreditorReference;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Référence créancier RF (ISO 11649) pour la QR-facture")
class CreditorReferenceTest {

    @Test
    @DisplayName("exemple officiel de la norme reconnu valide")
    void officialExample() {
        assertTrue(CreditorReference.isValid("RF18539007547034"));
        assertTrue(CreditorReference.isValid("RF18 5390 0754 7034"));
    }

    @Test
    @DisplayName("une référence modifiée d'un caractère est détectée")
    void typoDetected() {
        assertFalse(CreditorReference.isValid("RF18539007547035"));
        assertFalse(CreditorReference.isValid("RF19539007547034"));
    }

    @Test
    @DisplayName("génération à partir du numéro de document, toujours valide")
    void generation() {
        assertEquals("RF18539007547034", CreditorReference.fromDocumentNumber("539007547034"));
        for (String number : new String[]{"F-2027-0001", "NC-2027-0042", "F-2030-9999"}) {
            assertTrue(CreditorReference.isValid(CreditorReference.fromDocumentNumber(number)), number);
        }
    }
}
