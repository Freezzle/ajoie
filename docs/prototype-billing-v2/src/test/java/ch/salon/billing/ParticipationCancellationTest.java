package ch.salon.billing;

import ch.salon.billing.domain.BillingCase;
import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.Money;
import ch.salon.billing.domain.Payment;
import ch.salon.billing.domain.Refund;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import ch.salon.billing.support.FakeParticipation.BillingProcess;
import ch.salon.billing.support.FakeParticipation.Status;
import ch.salon.billing.support.FakeParticipationWorkflow;
import ch.salon.billing.support.FakeParticipationWorkflow.CancellationDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Annuler une participation QUEL QUE SOIT l'état de sa facturation. La participation passe tout de
 * suite à « annulée » ; la facturation régularise. Après chaque cas : rien n'est dû, et l'argent
 * gardé = exactement les frais décidés.
 */
@DisplayName("Annulation d'une participation selon l'état de la facturation")
class ParticipationCancellationTest extends BillingTestBase {

    FakeParticipationWorkflow workflow;

    @BeforeEach
    void wireWorkflow() {
        workflow = new FakeParticipationWorkflow(billing, policy, () -> today);
        listeners.add(workflow::onBillingEvent);
    }

    /** 450 stand + 35 électricité = 485.– (principal) ; repas facturés à part : 45.– */
    private FakeParticipation accepted(BillingProcess process) {
        FakeParticipation p = workflow.register(FakeParticipation.registration("P-X").process(process)
                .stand("S1", "3x3").electricity("S1", true).mealsSaturday(2));
        workflow.accept(p);
        return p;
    }

    /** Contrôle commun à tous les cas : dossier soldé, et argent conservé = frais attendus. */
    private void assertClosedKeeping(FakeParticipation p, String kept) {
        BillingCase c = caseOf(p);
        assertEquals(Status.CANCELED, p.status());
        assertEquals(Status.CANCELED, p.standStatus("S1"));
        assertTrue(c.pendingLines().isEmpty(), "plus rien à facturer");
        assertMoney("0.00", c.balance());
        assertMoney("0.00", c.credit());
        assertMoney("0.00", c.undeductedDeposits());
        Money received = c.payments().stream().map(Payment::amount).reduce(Money.ZERO, Money::plus);
        Money refunded = c.refunds().stream().map(Refund::amount).reduce(Money.ZERO, Money::plus);
        assertMoney(kept, received.minus(refunded));
        c.checkInvariants();
    }

    @Nested
    @DisplayName("Rien d'émis")
    class NothingIssued {

        @Test
        @DisplayName("en vérification → annulée, aucun dossier de facturation")
        void inVerification() {
            FakeParticipation p = workflow.register(FakeParticipation.registration("P-V").stand("S1", "3x3"));
            workflow.cancel(p, CancellationDecision.refundEverything());
            assertEquals(Status.CANCELED, p.status());
            assertThrows(IllegalArgumentException.class, () -> billing.caseOf(p.caseRef()));
        }

        @Test
        @DisplayName("acceptée (normal), brouillon seulement → le brouillon disparaît, aucun document")
        void draftOnly() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            workflow.cancel(p, CancellationDecision.refundEverything());
            assertTrue(caseOf(p).documents().isEmpty());
            assertTrue(caseOf(p).pendingLines().isEmpty());
        }

        @Test
        @DisplayName("acceptée (normal) avec frais d'annulation → facture des frais seuls")
        void draftOnlyWithFee() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            workflow.cancel(p, CancellationDecision.fee("50.00"));
            BillingDocument f = caseOf(p).documents().get(0);
            assertLines(f, "Frais d'annulation | 1 | 50.00");
            bankTransfer(f, "50.00");
            assertClosedKeeping(p, "50.00");
        }
    }

    @Nested
    @DisplayName("Acompte")
    class Deposit {

        @Test
        @DisplayName("acompte émis, impayé → annulé par note de crédit, rien n'est dû")
        void unpaidDeposit() {
            FakeParticipation p = accepted(BillingProcess.DEPOSIT);
            workflow.cancel(p, CancellationDecision.refundEverything());
            assertEquals(List.of(DocumentKind.DEPOSIT, DocumentKind.CREDIT_NOTE),
                    caseOf(p).documents().stream().map(BillingDocument::kind).toList());
            assertClosedKeeping(p, "0.00");
        }

        @Test
        @DisplayName("acompte payé, on rembourse tout → note de crédit, avoir remboursé")
        void paidDepositRefunded() {
            FakeParticipation p = accepted(BillingProcess.DEPOSIT);
            bankTransfer(caseOf(p).documents().get(0), "100.00");
            assertEquals(Status.VALIDATED, p.status());
            workflow.cancel(p, CancellationDecision.refundEverything());
            assertEquals(1, caseOf(p).refunds().size());
            assertClosedKeeping(p, "0.00");
        }

        @Test
        @DisplayName("acompte payé, conservé (règlement) → facture « frais » 100 − déduction 100 = 0, aucun remboursement")
        void paidDepositKept() {
            FakeParticipation p = accepted(BillingProcess.DEPOSIT);
            bankTransfer(caseOf(p).documents().get(0), "100.00");
            workflow.cancel(p, CancellationDecision.keepDeposit());
            BillingDocument f = caseOf(p).documents().get(1);
            assertLines(f, "Frais d'annulation | 1 | 100.00", "Déduction acompte A-2027-0001 | 1 | -100.00");
            assertMoney("0.00", f.total());
            assertTrue(caseOf(p).refunds().isEmpty());
            assertClosedKeeping(p, "100.00");
        }

        @Test
        @DisplayName("acompte payé en partie (40), conservé → frais 40, solde d'acompte annulé")
        void partiallyPaidDepositKept() {
            FakeParticipation p = accepted(BillingProcess.DEPOSIT);
            bankTransfer(caseOf(p).documents().get(0), "40.00");
            workflow.cancel(p, CancellationDecision.keepDeposit());
            assertClosedKeeping(p, "40.00");
        }

        @Test
        @DisplayName("acompte payé, facture finale émise et payée en partie, acompte conservé → remboursement du reste")
        void depositAndPartiallyPaidInvoiceKept() {
            FakeParticipation p = accepted(BillingProcess.DEPOSIT);
            bankTransfer(caseOf(p).documents().get(0), "100.00");
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            assertMoney("385.00", invoices.get(0).total()); // 485 − 100
            bankTransfer(invoices.get(0), "150.00");
            workflow.cancel(p, CancellationDecision.keepDeposit());
            // reçu 250 (100 acompte + 150) ; gardé 100 ; remboursé 150
            assertMoney("150.00", caseOf(p).refunds().get(0).amount());
            assertClosedKeeping(p, "100.00");
        }
    }

    @Nested
    @DisplayName("Factures émises (processus normal)")
    class Invoices {

        @Test
        @DisplayName("factures émises, impayées → notes de crédit qui les soldent, aucun argent ne bouge")
        void unpaid() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            workflow.issueInvoices(p);
            workflow.cancel(p, CancellationDecision.refundEverything());
            long notes = caseOf(p).documents().stream().filter(BillingDocument::isCreditNote).count();
            assertEquals(2, notes, "une par groupe (principal, repas)");
            assertClosedKeeping(p, "0.00");
        }

        @Test
        @DisplayName("factures payées, frais de 50.– → note de crédit nette, remboursement de 480.–")
        void paidWithFee() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            bankTransfer(invoices.get(0), "485.00");
            bankTransfer(invoices.get(1), "45.00");
            workflow.cancel(p, CancellationDecision.fee("50.00"));
            assertMoney("480.00", caseOf(p).refunds().get(0).amount());
            assertClosedKeeping(p, "50.00");
        }

        @Test
        @DisplayName("principal payé, repas impayés, frais 50.– → les avoirs se compensent, remboursement du net")
        void mixed() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            bankTransfer(invoices.get(0), "485.00");
            workflow.cancel(p, CancellationDecision.fee("50.00"));
            assertClosedKeeping(p, "50.00");
        }

        @Test
        @DisplayName("frais supérieurs à ce qui a été payé → il reste une facture de frais à encaisser")
        void feeGreaterThanPaid() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            bankTransfer(invoices.get(1), "45.00"); // seuls les repas payés
            workflow.cancel(p, CancellationDecision.fee("100.00"));
            BillingCase c = caseOf(p);
            assertMoney("55.00", c.balance()); // 100 de frais − 45 déjà versés
            assertTrue(c.refunds().isEmpty());
            BillingDocument open = c.documents().stream()
                                    .filter(d -> d.isInvoice() && c.openAmount(d.number()).isPositive()).findFirst()
                                    .orElseThrow();
            bankTransfer(open, "55.00");
            assertClosedKeeping(p, "100.00");
        }
    }

    @Nested
    @DisplayName("Garde-fous")
    class Guards {

        @Test
        @DisplayName("salon commencé → annulation refusée")
        void afterShowStart() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            on(5, 15);
            assertThrows(IllegalStateException.class, () -> workflow.cancel(p, CancellationDecision.refundEverything()));
            assertEquals(Status.ACCEPTED, p.status());
        }

        @Test
        @DisplayName("annuler deux fois → refusé")
        void twice() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            workflow.cancel(p, CancellationDecision.refundEverything());
            assertThrows(IllegalStateException.class, () -> workflow.cancel(p, CancellationDecision.refundEverything()));
        }

        @Test
        @DisplayName("les documents émis avant l'annulation restent intacts (seules des notes de crédit s'ajoutent)")
        void historyPreserved() {
            FakeParticipation p = accepted(BillingProcess.STANDARD);
            List<BillingDocument> invoices = workflow.issueInvoices(p);
            workflow.cancel(p, CancellationDecision.refundEverything());
            assertEquals(invoices.get(0).total(), caseOf(p).document(invoices.get(0).number()).orElseThrow().total());
            assertEquals(invoices.get(0).lines(), caseOf(p).document(invoices.get(0).number()).orElseThrow().lines());
        }
    }
}
