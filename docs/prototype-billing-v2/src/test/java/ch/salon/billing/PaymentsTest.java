package ch.salon.billing;

import ch.salon.billing.application.BankNotification;
import ch.salon.billing.application.ImportResult;
import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.DocumentStatus;
import ch.salon.billing.domain.Money;
import ch.salon.billing.domain.PaymentMode;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;
import static ch.salon.billing.support.FakeParticipationBillingPolicy.MEALS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Paiements, affectation et avoir")
class PaymentsTest extends BillingTestBase {

    FakeParticipation p;
    BillingDocument f1; // 450.– (principal)
    BillingDocument f2; //  45.– (repas)

    @BeforeEach
    void twoInvoices() {
        p = new FakeParticipation("P-200").stand("S1", "3x3").mealsSaturday(2);
        sync(p);
        f1 = issueOrFail(p, MAIN);
        f2 = issueOrFail(p, MEALS);
    }

    @Nested
    @DisplayName("Statuts calculés")
    class Statuses {

        @Test
        @DisplayName("ouvert → partiellement payé → payé")
        void partial() {
            assertEquals(DocumentStatus.OPEN, caseOf(p).status(f1.number(), today));
            bankTransfer(f1, "200.00");
            assertEquals(DocumentStatus.PARTIALLY_PAID, caseOf(p).status(f1.number(), today));
            assertMoney("250.00", caseOf(p).openAmount(f1.number()));
            bankTransfer(f1, "250.00");
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f1.number(), today));
            assertEquals(1, count(BillingEvent.DocumentSettled.class));
        }

        @Test
        @DisplayName("en retard après l'échéance, payé dès qu'il est soldé même en retard")
        void overdue() {
            on(2, 10); // échéance 09.02
            assertEquals(DocumentStatus.OVERDUE, caseOf(p).status(f1.number(), today));
            bankTransfer(f1, "100.00");
            assertEquals(DocumentStatus.OVERDUE, caseOf(p).status(f1.number(), today));
            bankTransfer(f1, "350.00");
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f1.number(), today));
        }
    }

    @Nested
    @DisplayName("Affectation")
    class Allocation {

        @Test
        @DisplayName("un seul virement pour deux factures → les deux sont réglées")
        void oneTransferTwoInvoices() {
            bankTransfer(f1, "495.00");
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f1.number(), today));
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f2.number(), today));
            assertTrue(caseOf(p).isSettled());
        }

        @Test
        @DisplayName("paiement avec la référence d'une facture déjà payée → va sur la plus ancienne facture ouverte")
        void targetAlreadyPaid() {
            bankTransfer(f1, "450.00");
            bankTransfer(f1, "45.00"); // l'exposant réutilise le mauvais bulletin
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f2.number(), today));
            assertMoney("0.00", caseOf(p).credit());
        }

        @Test
        @DisplayName("sans référence → factures ouvertes de la plus ancienne à la plus récente")
        void fifo() {
            billing.recordPayment(p.caseRef(), chf("460.00"), PaymentMode.CASH, null);
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f1.number(), today));
            assertMoney("35.00", caseOf(p).openAmount(f2.number()));
        }

        @Test
        @DisplayName("trop-perçu → avoir, annoncé, puis utilisé automatiquement par la facture suivante")
        void overpaymentThenNextInvoice() {
            bankTransfer(f1, "550.00");
            assertMoney("55.00", caseOf(p).credit());
            assertMoney("-55.00", caseOf(p).balance());
            assertEquals(1, count(BillingEvent.CreditAvailable.class));

            p.tables("S1", 2);
            sync(p);
            BillingDocument f3 = issueOrFail(p, MAIN); // 30.–
            assertEquals(DocumentStatus.PAID, caseOf(p).status(f3.number(), today));
            assertMoney("25.00", caseOf(p).credit());
        }

        @Test
        @DisplayName("paiement reçu AVANT la facture (prépaiement) → avoir, consommé à l'émission")
        void prepayment() {
            FakeParticipation q = new FakeParticipation("P-201").stand("S1", "2x2");
            sync(q);
            billing.recordPayment(q.caseRef(), chf("300.00"), PaymentMode.BANK, null);
            assertMoney("300.00", caseOf(q).credit());
            BillingDocument f = issueOrFail(q, MAIN);
            assertEquals(DocumentStatus.PAID, caseOf(q).status(f.number(), today));
            assertTrue(caseOf(q).isSettled());
        }
    }

    @Nested
    @DisplayName("Import bancaire (camt.054)")
    class BankImport {

        @Test
        @DisplayName("le même avis importé deux fois n'est compté qu'une fois")
        void duplicate() {
            BankNotification n = new BankNotification("TX-1", today, chf("450.00"), f1.qrReference());
            assertEquals(1, billing.importBankNotifications(List.of(n)).matched().size());
            ImportResult again = billing.importBankNotifications(List.of(n));
            assertEquals(1, again.duplicates().size());
            assertEquals(1, caseOf(p).payments().size());
        }

        @Test
        @DisplayName("référence inconnue → reste à traiter à la main, rien n'est enregistré")
        void unknownReference() {
            ImportResult r = billing.importBankNotifications(List.of(
                    new BankNotification("TX-9", today, chf("10.00"), "RF18539007547034")));
            assertEquals(1, r.unmatched().size());
            assertTrue(caseOf(p).payments().isEmpty());
        }

        @Test
        @DisplayName("la référence est reconnue même imprimée avec des espaces")
        void spacedReference() {
            String spaced = f1.qrReference().replaceAll("(.{4})", "$1 ").trim();
            ImportResult r = billing.importBankNotifications(List.of(
                    new BankNotification("TX-2", today, chf("450.00"), spaced)));
            assertEquals(1, r.matched().size());
        }
    }

    @Nested
    @DisplayName("Remboursements et garde-fous")
    class Refunds {

        @Test
        @DisplayName("on ne rembourse pas plus que l'avoir")
        void refundLimit() {
            bankTransfer(f1, "500.00"); // 450 sur F1, 45 sur F2, 5 d'avoir
            assertMoney("5.00", caseOf(p).credit());
            assertThrows(IllegalStateException.class, () -> billing.refund(p.caseRef(), chf("6.00"), "trop"));
            billing.refund(p.caseRef(), chf("5.00"), "Remboursement trop-perçu");
            assertTrue(caseOf(p).isSettled());
        }

        @Test
        @DisplayName("montant nul ou négatif refusé")
        void invalidAmounts() {
            assertThrows(IllegalArgumentException.class,
                    () -> billing.recordPayment(p.caseRef(), chf("0.00"), PaymentMode.CASH, null));
            assertThrows(IllegalArgumentException.class,
                    () -> billing.recordPayment(p.caseRef(), chf("-10.00"), PaymentMode.CASH, null));
            assertThrows(IllegalArgumentException.class, () -> billing.refund(p.caseRef(), chf("0.00"), "x"));
        }

        @Test
        @DisplayName("arrondi aux 5 centimes pour l'encaissement en espèces")
        void cashRounding() {
            assertEquals(Money.chf("67.45"), Money.chf("67.47").roundToCash());
            assertEquals(Money.chf("67.50"), Money.chf("67.48").roundToCash());
            assertEquals(Money.chf("0.00"), Money.chf("0.02").roundToCash());
        }

        @Test
        @DisplayName("solde « factures ouvertes − avoir » = solde comptable, à chaque étape")
        void ledgerConsistency() {
            bankTransfer(f1, "100.00");
            assertEquals(caseOf(p).ledgerBalance(), caseOf(p).balance());
            bankTransfer(f2, "500.00");
            assertEquals(caseOf(p).ledgerBalance(), caseOf(p).balance());
            billing.refund(p.caseRef(), chf("105.00"), "trop-perçu");
            assertEquals(caseOf(p).ledgerBalance(), caseOf(p).balance());
            assertTrue(caseOf(p).isSettled());
        }
    }
}
