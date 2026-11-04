package ch.salon.billing;

import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.ChargeKind;
import ch.salon.billing.domain.CreditorReference;
import ch.salon.billing.domain.Debtor;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.DocumentLine;
import ch.salon.billing.domain.DocumentStatus;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;
import static ch.salon.billing.support.FakeParticipationBillingPolicy.MEALS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Émission des documents")
class IssuingTest extends BillingTestBase {

    @Nested
    @DisplayName("Numérotation")
    class Numbering {

        @Test
        @DisplayName("rien à facturer → aucun document et aucun numéro consommé")
        void nothingToIssue() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            sync(p);
            assertTrue(issue(p, MEALS).isEmpty());
            assertEquals("F-2027-0001", issueOrFail(p, MAIN).number());
            assertTrue(issue(p, MAIN).isEmpty());
        }

        @Test
        @DisplayName("suite continue entre dossiers, séparée par type de document")
        void continuousAcrossCases() {
            FakeParticipation a = new FakeParticipation("A").stand("S1", "3x3");
            FakeParticipation b = new FakeParticipation("B").stand("S2", "2x2");
            sync(a);
            sync(b);
            assertEquals("F-2027-0001", issueOrFail(a, MAIN).number());
            assertEquals("F-2027-0002", issueOrFail(b, MAIN).number());
            a.removeStand("S1");
            sync(a);
            assertEquals("NC-2027-0001", issueOrFail(a, MAIN).number());
            b.tables("S2", 1);
            sync(b);
            assertEquals("F-2027-0003", issueOrFail(b, MAIN).number());
        }

        @Test
        @DisplayName("la numérotation repart à 1 chaque année")
        void yearlySequence() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            on(2027, 12, 20);
            sync(p);
            assertEquals("F-2027-0001", issueOrFail(p, MAIN).number());
            on(2028, 1, 5);
            p.tables("S1", 1);
            sync(p);
            assertEquals("F-2028-0001", issueOrFail(p, MAIN).number());
        }
    }

    @Nested
    @DisplayName("Type et contenu")
    class Content {

        @Test
        @DisplayName("total négatif → note de crédit, sans échéance")
        void creditNote() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").electricity("S1", true);
            sync(p);
            issueOrFail(p, MAIN);
            p.electricity("S1", false);
            sync(p);
            BillingDocument nc = issueOrFail(p, MAIN);
            assertEquals(DocumentKind.CREDIT_NOTE, nc.kind());
            assertNull(nc.dueDate());
            assertEquals(List.of("F-2027-0001"), nc.corrects());
        }

        @Test
        @DisplayName("total nul (changement de libellé au même prix) → facture rectificative à 0, réglée d'office")
        void zeroTotal() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            sync(p);
            BillingDocument f1 = issueOrFail(p, MAIN);
            bankTransfer(f1, "450.00");
            billing.syncCharges(p.caseRef(), List.of(ch.salon.billing.domain.ChargeSpec
                    .charge("stand:S1", "Stand 3x3 m – angle").price("450.00").category("stand")
                    .attribute("dimension", "3x3").build()));
            BillingDocument f2 = issueOrFail(p, MAIN);
            assertEquals(DocumentKind.INVOICE, f2.kind());
            assertMoney("0.00", f2.total());
            assertEquals(2, f2.lines().size());
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f2.number(), today));
            assertTrue(caseOf(p).isSettled());
        }

        @Test
        @DisplayName("une réduction (geste commercial) apparaît comme ligne négative de la facture")
        void discountLine() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").guestOfHonor(true);
            sync(p);
            BillingDocument f1 = issueOrFail(p, MAIN);
            assertLines(f1, "Stand 3x3 m | 1 | 450.00", "Réduction invité d'honneur | 1 | -100.00");
            assertEquals(ChargeKind.DISCOUNT, f1.lines().get(1).variant().kind());
            assertMoney("350.00", f1.total());
        }

        @Test
        @DisplayName("émettre un groupe ne touche pas aux autres groupes")
        void groupsAreIndependent() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").mealsSaturday(2);
            sync(p);
            issueOrFail(p, MAIN);
            assertEquals(1, caseOf(p).pendingLines(MEALS).size());
        }

        @Test
        @DisplayName("la référence QR est une référence créancier RF valide, propre au document")
        void qrReference() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").mealsSaturday(1);
            sync(p);
            BillingDocument f1 = issueOrFail(p, MAIN);
            BillingDocument f2 = issueOrFail(p, MEALS);
            assertTrue(CreditorReference.isValid(f1.qrReference()));
            assertTrue(f1.qrReference().endsWith("F20270001"));
            assertTrue(!f1.qrReference().equals(f2.qrReference()));
        }
    }

    @Nested
    @DisplayName("Échéances (règles fournies par l'appelant)")
    class DueDates {

        @Test
        @DisplayName("sans arrangement → délai par défaut de 30 jours")
        void defaultTerm() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            sync(p);
            assertEquals(LocalDate.of(2027, 2, 9), issueOrFail(p, MAIN).dueDate());
        }

        @Test
        @DisplayName("avec arrangement → échéance à la date du salon")
        void arrangement() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").arrangement(true);
            sync(p);
            assertEquals(LocalDate.of(2027, 5, 15), issueOrFail(p, MAIN).dueDate());
        }

        @Test
        @DisplayName("une échéance antérieure à l'émission est refusée")
        void dueBeforeIssue() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").arrangement(true);
            on(6, 1); // après la date du salon
            sync(p);
            assertThrows(IllegalArgumentException.class, () -> issue(p, MAIN));
        }
    }

    @Nested
    @DisplayName("Conformité")
    class Compliance {

        @Test
        @DisplayName("adresse incomplète (QR type S : nom, localité, pays) → émission refusée, aucun numéro consommé")
        void incompleteAddress() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            sync(p);
            billing.openCase(p.caseRef(), new Debtor("Dupont", "Rue", "1", "2900", "", "CH", "fr"));
            assertThrows(IllegalStateException.class, () -> issue(p, MAIN));
            billing.openCase(p.caseRef(), DUPONT);
            assertEquals("F-2027-0001", issueOrFail(p, MAIN).number());
        }

        @Test
        @DisplayName("un document émis est immuable (lignes non modifiables)")
        void immutableLines() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            sync(p);
            BillingDocument f1 = issueOrFail(p, MAIN);
            assertThrows(UnsupportedOperationException.class, () -> f1.lines().add(f1.lines().get(0)));
            assertThrows(UnsupportedOperationException.class, () -> f1.corrects().add("X"));
        }

        @Test
        @DisplayName("l'adresse est figée dans le document : un déménagement ne réécrit pas l'historique")
        void debtorSnapshot() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3");
            sync(p);
            BillingDocument f1 = issueOrFail(p, MAIN);
            billing.openCase(p.caseRef(), new Debtor("Boulangerie Dupont SA", "Grand-Rue", "3", "2800", "Delémont",
                    "CH", "fr"));
            assertEquals("Porrentruy", f1.debtor().city());
            p.tables("S1", 1);
            billing.syncCharges(p.caseRef(), policy.desiredCharges(p)); // sans réouvrir le dossier
            assertEquals("Delémont", issueOrFail(p, MAIN).debtor().city());
        }

        @Test
        @DisplayName("chaque émission publie un événement DocumentIssued")
        void events() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x3").mealsSaturday(1);
            sync(p);
            billing.issueAll(p.caseRef(), null);
            assertEquals(2, count(BillingEvent.DocumentIssued.class));
        }

        @Test
        @DisplayName("le total d'un document est exactement la somme de ses lignes")
        void totalIsSumOfLines() {
            FakeParticipation p = new FakeParticipation("P-1").stand("S1", "3x4").electricity("S1", true)
                    .tables("S1", 3).postal(true).guestOfHonor(true);
            sync(p);
            BillingDocument f1 = issueOrFail(p, MAIN);
            assertEquals(sumLines(f1), f1.total());
            assertMoney("533.00", f1.total());
            assertEquals(List.of(1, 2, 3, 4, 5), f1.lines().stream().map(DocumentLine::position).toList());
        }
    }
}
