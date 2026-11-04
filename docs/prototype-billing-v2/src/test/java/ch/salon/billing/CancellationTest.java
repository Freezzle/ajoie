package ch.salon.billing;

import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.DocumentStatus;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Annulation d'une participation. La règle (frais retenus ou non) est décidée par les
 * participations ; la facturation se contente d'appliquer la nouvelle liste attendue.
 */
@DisplayName("Annulation d'une participation")
class CancellationTest extends BillingTestBase {

    FakeParticipation p;

    @BeforeEach
    void participation() {
        // 450 stand + 35 électricité + 30 tables = 515.– (même groupe)
        p = new FakeParticipation("P-300").stand("S1", "3x3").electricity("S1", true).tables("S1", 2);
    }

    @Test
    @DisplayName("avant toute facture → rien à émettre, aucune trace")
    void beforeAnyInvoice() {
        sync(p);
        p.cancel();
        sync(p);
        assertTrue(billing.preview(p.caseRef()).isEmpty());
        assertTrue(billing.issueAll(p.caseRef(), null).isEmpty());
        assertTrue(caseOf(p).documents().isEmpty());
    }

    @Test
    @DisplayName("facture émise mais impayée → note de crédit qui la solde, aucun argent ne bouge")
    void invoicedNotPaid() {
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        p.cancel();
        sync(p);
        BillingDocument nc = issueOrFail(p, MAIN);
        assertEquals(DocumentKind.CREDIT_NOTE, nc.kind());
        assertMoney("-515.00", nc.total());
        assertEquals(List.of(f1.number()), nc.corrects());
        assertEquals(DocumentStatus.PAID, caseOf(p).status(f1.number(), today)); // réglée par la note de crédit
        assertTrue(caseOf(p).isSettled());
        assertTrue(caseOf(p).payments().isEmpty());
    }

    @Test
    @DisplayName("facture payée → note de crédit, avoir annoncé, remboursement, dossier soldé")
    void invoicedAndPaid() {
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        bankTransfer(f1, "515.00");
        p.cancel();
        sync(p);
        issueOrFail(p, MAIN);
        assertMoney("515.00", caseOf(p).credit());
        assertTrue(events.stream().anyMatch(e -> e instanceof BillingEvent.CreditAvailable c
                && c.credit().equals(chf("515.00"))));
        assertFalse(caseOf(p).isSettled());
        billing.refund(p.caseRef(), chf("515.00"), "Annulation de la participation");
        assertTrue(caseOf(p).isSettled());
    }

    @Test
    @DisplayName("annulation avec frais retenus (règle salon) → note de crédit nette, remboursement du reste")
    void cancellationFee() {
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        bankTransfer(f1, "515.00");
        p.cancelWithFee("100.00");
        sync(p);
        BillingDocument nc = issueOrFail(p, MAIN);
        assertLines(nc,
                "Frais d'annulation | 1 | 100.00",
                "Annulation : Stand 3x3 m (F-2027-0001) | -1 | -450.00",
                "Annulation : Électricité 230 V (F-2027-0001) | -1 | -35.00",
                "Annulation : Table supplémentaire (F-2027-0001) | -2 | -30.00");
        assertMoney("-415.00", nc.total());
        assertMoney("415.00", caseOf(p).credit());
        billing.refund(p.caseRef(), chf("415.00"), "Annulation, frais retenus 100.–");
        assertTrue(caseOf(p).isSettled());
    }

    @Test
    @DisplayName("facture partiellement payée → la note de crédit règle le reste dû, l'acompte versé devient avoir")
    void partiallyPaid() {
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        bankTransfer(f1, "200.00");
        p.cancel();
        sync(p);
        issueOrFail(p, MAIN);
        assertMoney("0.00", caseOf(p).openAmount(f1.number()));
        assertMoney("200.00", caseOf(p).credit());
        billing.refund(p.caseRef(), chf("200.00"), "Annulation");
        assertTrue(caseOf(p).isSettled());
    }

    @Test
    @DisplayName("annulée puis rétablie avant émission de la note de crédit → rien à faire")
    void cancelledThenReinstated() {
        sync(p);
        issueOrFail(p, MAIN);
        p.cancel();
        sync(p);
        p.reinstate();
        sync(p);
        assertTrue(billing.preview(p.caseRef()).isEmpty());
    }

    @Test
    @DisplayName("annulée puis rétablie APRÈS la note de crédit → nouvelle facture des prestations")
    void cancelledCreditedThenReinstated() {
        sync(p);
        issueOrFail(p, MAIN);
        p.cancel();
        sync(p);
        issueOrFail(p, MAIN);
        p.reinstate();
        sync(p);
        BillingDocument f2 = issueOrFail(p, MAIN);
        assertEquals("F-2027-0002", f2.number());
        assertMoney("515.00", f2.total());
        assertMoney("515.00", caseOf(p).balance());
    }
}
