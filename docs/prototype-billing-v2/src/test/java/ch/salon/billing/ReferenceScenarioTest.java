package ch.salon.billing;

import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.DocumentStatus;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;
import static ch.salon.billing.support.FakeParticipationBillingPolicy.MEALS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Scénario de référence (celui de la conception) : Boulangerie Dupont, salon des 15-16 mai 2027,
 * repas facturés à part, sans acompte. Chaque étape vérifie documents, statuts et solde.
 */
@DisplayName("Scénario de référence : inscription → changements → facturation → paiements → soldé")
class ReferenceScenarioTest extends BillingTestBase {

    @Test
    @DisplayName("Dupont : 3 factures, 1 note de crédit, 3 paiements, solde 0 et prestations = documents = paiements = 625.–")
    void fullLifecycle() {
        FakeParticipation dupont = new FakeParticipation("P-045")
                .stand("S1", "3x3").electricity("S1", true).tables("S1", 2).mealsSaturday(2);

        // 10.01 — inscription acceptée : tout est « à facturer », rien n'est émis
        sync(dupont);
        assertEquals(4, billing.preview(dupont.caseRef()).size());
        assertTrue(caseOf(dupont).documents().isEmpty());

        // 20.01 — un repas de plus, AVANT facturation : simple mise à jour, aucune trace sur les documents
        on(1, 20);
        dupont.mealsSaturday(3);
        assertTrue(sync(dupont).changed());
        assertEquals(4, billing.preview(dupont.caseRef()).size());
        assertMoney("67.50", caseOf(dupont).pendingLines(MEALS).get(0).amount());

        // 01.02 — émission : un document par groupe (règle salon « repas à part »)
        on(2, 1);
        BillingDocument f1 = issueOrFail(dupont, MAIN);
        BillingDocument f2 = issueOrFail(dupont, MEALS);
        assertEquals("F-2027-0001", f1.number());
        assertEquals("F-2027-0002", f2.number());
        assertLines(f1, "Stand 3x3 m | 1 | 450.00", "Électricité 230 V | 1 | 35.00", "Table supplémentaire | 2 | 30.00");
        assertLines(f2, "Repas samedi | 3 | 67.50");
        assertEquals(java.time.LocalDate.of(2027, 3, 3), f1.dueDate());
        assertTrue(billing.preview(dupont.caseRef()).isEmpty(), "plus rien à facturer");

        // 15.02 — virement de 515.– rapproché par la référence QR
        on(2, 15);
        assertEquals(1, bankTransfer(f1, "515.00").matched().size());
        assertEquals(DocumentStatus.PAID, caseOf(dupont).status(f1.number(), today));

        // 01.03 — APRÈS facturation : stand 3x3 → 3x4 et plus d'électricité
        on(3, 1);
        dupont.resizeStand("S1", "3x4").electricity("S1", false);
        sync(dupont);
        assertTrue(caseOf(dupont).pendingLines(MEALS).isEmpty());

        // 05.03 — facture complémentaire : la facture F-0001 n'est pas touchée
        on(3, 5);
        BillingDocument f3 = issueOrFail(dupont, MAIN);
        assertEquals(DocumentKind.INVOICE, f3.kind());
        assertLines(f3,
                "Annulation : Stand 3x3 m (F-2027-0001) | -1 | -450.00",
                "Stand 3x4 m | 1 | 550.00",
                "Annulation : Électricité 230 V (F-2027-0001) | -1 | -35.00");
        assertMoney("65.00", f3.total());
        assertEquals(List.of("F-2027-0001"), f3.corrects());
        assertLines(f1, "Stand 3x3 m | 1 | 450.00", "Électricité 230 V | 1 | 35.00", "Table supplémentaire | 2 | 30.00");

        // 13.03 — les repas ne sont pas payés à l'échéance du 03.03
        on(3, 13);
        assertEquals(DocumentStatus.OVERDUE, caseOf(dupont).status(f2.number(), today));

        // 20.03 — repas payés
        on(3, 20);
        bankTransfer(f2, "67.50");
        assertEquals(DocumentStatus.PAID, caseOf(dupont).status(f2.number(), today));

        // 20.04 — un repas en moins, alors que la facture repas est déjà payée → note de crédit
        on(4, 20);
        dupont.mealsSaturday(2);
        sync(dupont);
        BillingDocument nc1 = issueOrFail(dupont, MEALS);
        assertEquals("NC-2027-0001", nc1.number());
        assertEquals(DocumentKind.CREDIT_NOTE, nc1.kind());
        assertLines(nc1, "Repas samedi – modification de quantité (F-2027-0002) | -1 | -22.50");
        assertEquals(List.of("F-2027-0002"), nc1.corrects());
        // … portée automatiquement en déduction de la facture encore ouverte F-0003
        assertMoney("42.50", caseOf(dupont).openAmount(f3.number()));
        // F-0003 était due le 04.04 : partiellement réglée, mais toujours en retard pour le solde
        assertEquals(DocumentStatus.OVERDUE, caseOf(dupont).status(f3.number(), today));
        assertMoney("0.00", caseOf(dupont).credit());

        // 28.04 — dernier virement : le dossier est soldé
        on(4, 28);
        assertFalse(caseOf(dupont).isSettled());
        bankTransfer(f3, "42.50");
        assertTrue(caseOf(dupont).isSettled());
        assertEquals(1, count(BillingEvent.CaseSettled.class));

        // Contrôle final : prestations = documents = paiements
        var c = caseOf(dupont);
        assertMoney("625.00", c.documents().stream().map(BillingDocument::total).reduce(chf("0"), (a, b) -> a.plus(b)));
        assertMoney("625.00", c.payments().stream().map(p -> p.amount()).reduce(chf("0"), (a, b) -> a.plus(b)));
        assertMoney("0.00", c.balance());
        assertMoney("0.00", c.ledgerBalance());
    }
}
