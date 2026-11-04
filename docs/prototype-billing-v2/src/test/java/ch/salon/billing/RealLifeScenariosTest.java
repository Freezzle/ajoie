package ch.salon.billing;

import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.DocumentStatus;
import ch.salon.billing.domain.PaymentMode;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;
import static ch.salon.billing.support.FakeParticipationBillingPolicy.MEALS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Situations rencontrées dans la vie d'un salon, de l'inscription au jour J. */
@DisplayName("Scénarios de la vie réelle")
class RealLifeScenariosTest extends BillingTestBase {

    @Test
    @DisplayName("beaucoup d'hésitations avant la facture → un seul document avec l'état final")
    void manyChangesBeforeFirstInvoice() {
        FakeParticipation p = new FakeParticipation("P-1").stand("S1", "2x2");
        sync(p);
        p.resizeStand("S1", "3x3"); sync(p);
        p.electricity("S1", true); sync(p);
        p.tables("S1", 3); sync(p);
        p.tables("S1", 1); sync(p);
        p.resizeStand("S1", "3x4"); sync(p);
        p.electricity("S1", false); sync(p);

        BillingDocument f1 = issueOrFail(p, MAIN);
        assertLines(f1, "Stand 3x4 m | 1 | 550.00", "Table supplémentaire | 1 | 15.00");
        assertMoney("565.00", f1.total());
    }

    @Test
    @DisplayName("plusieurs changements après facture, regroupés en UNE facture complémentaire")
    void batchedAdjustments() {
        FakeParticipation p = new FakeParticipation("P-2").stand("S1", "3x3").tables("S1", 1);
        sync(p);
        issueOrFail(p, MAIN);
        on(2, 1);  p.tables("S1", 3); sync(p);
        on(2, 15); p.electricity("S1", true); sync(p);
        on(3, 1);  p.tables("S1", 2); sync(p);
        on(4, 1);  // émission groupée (ex. 45 jours avant le salon)
        BillingDocument f2 = issueOrFail(p, MAIN);
        assertLines(f2,
                "Électricité 230 V | 1 | 35.00",
                "Table supplémentaire – modification de quantité (F-2027-0001) | 1 | 15.00");
        assertMoney("50.00", f2.total());
    }

    @Test
    @DisplayName("changement de stand (nouvel emplacement = nouvelle clé) → annulation de l'ancien + nouveau")
    void standSwap() {
        FakeParticipation p = new FakeParticipation("P-3").stand("S1", "3x3");
        sync(p);
        issueOrFail(p, MAIN);
        p.removeStand("S1").stand("S7", "3x3");
        sync(p);
        BillingDocument f2 = issueOrFail(p, MAIN);
        assertLines(f2, "Stand 3x3 m | 1 | 450.00", "Annulation : Stand 3x3 m (F-2027-0001) | -1 | -450.00");
        assertMoney("0.00", f2.total());
    }

    @Test
    @DisplayName("passage à l'envoi postal après facture → frais postaux sur la facture suivante")
    void switchToPostal() {
        FakeParticipation p = new FakeParticipation("P-4").stand("S1", "3x3");
        sync(p);
        issueOrFail(p, MAIN);
        p.postal(true);
        sync(p);
        assertLines(issueOrFail(p, MAIN), "Frais d'envoi postal | 1 | 3.00");
    }

    @Test
    @DisplayName("les repas ne sont plus facturés à part → note de crédit « repas » + facture « principal », compensées")
    void mealsRegrouped() {
        FakeParticipation p = new FakeParticipation("P-5").stand("S1", "3x3").mealsSaturday(2);
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        BillingDocument f2 = issueOrFail(p, MEALS);
        bankTransfer(f1, "450.00");
        bankTransfer(f2, "45.00");

        p.mealsSeparate(false);
        sync(p);
        List<BillingDocument> docs = billing.issueAll(p.caseRef(), null);
        // groupe « repas » : note de crédit (avoir 45.–) ; groupe « principal » : facture réglée par cet avoir
        assertEquals(List.of(DocumentKind.CREDIT_NOTE, DocumentKind.INVOICE), docs.stream().map(BillingDocument::kind).toList());
        assertMoney("-45.00", docs.get(0).total());
        assertMoney("45.00", docs.get(1).total());
        assertEquals(DocumentStatus.PAID, caseOf(p).status(docs.get(1).number(), today));
        assertTrue(caseOf(p).isSettled());
    }

    @Test
    @DisplayName("le jour du salon : une table ajoutée sur place, facturée et payée en espèces immédiatement")
    void dayOfTheShow() {
        FakeParticipation p = new FakeParticipation("P-6").stand("S1", "3x3").arrangement(true);
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        on(5, 15);
        bankTransfer(f1, "450.00");
        p.tables("S1", 1);
        sync(p);
        BillingDocument f2 = issueOrFail(p, MAIN);
        billing.recordPayment(p.caseRef(), f2.total().roundToCash(), PaymentMode.CASH, f2.number());
        assertEquals(DocumentStatus.PAID, caseOf(p).status(f2.number(), today));
        assertTrue(caseOf(p).isSettled());
    }

    @Test
    @DisplayName("arrangement : rien n'est en retard avant la date du salon")
    void arrangementNotOverdueBeforeShow() {
        FakeParticipation p = new FakeParticipation("P-7").stand("S1", "3x3").arrangement(true);
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        on(5, 15);
        assertEquals(DocumentStatus.OPEN, caseOf(p).status(f1.number(), today));
        on(5, 16);
        assertEquals(DocumentStatus.OVERDUE, caseOf(p).status(f1.number(), today));
    }

    @Test
    @DisplayName("deux participations du même exposant : dossiers étanches, l'argent ne passe pas de l'un à l'autre")
    void separateCases() {
        FakeParticipation y2027 = new FakeParticipation("P-2027").stand("S1", "3x3");
        FakeParticipation conf = new FakeParticipation("P-CONF").stand("S9", "2x2");
        sync(y2027);
        sync(conf);
        BillingDocument a = issueOrFail(y2027, MAIN);
        BillingDocument b = issueOrFail(conf, MAIN);
        bankTransfer(a, "500.00"); // 50 de trop sur le dossier 2027
        assertMoney("50.00", caseOf(y2027).credit());
        assertMoney("300.00", caseOf(conf).openAmount(b.number()));
    }

    @Test
    @DisplayName("invité d'honneur accordé après facture → note de crédit du geste commercial")
    void discountGrantedLater() {
        FakeParticipation p = new FakeParticipation("P-8").stand("S1", "3x3");
        sync(p);
        BillingDocument f1 = issueOrFail(p, MAIN);
        bankTransfer(f1, "450.00");
        p.guestOfHonor(true);
        sync(p);
        BillingDocument nc = issueOrFail(p, MAIN);
        assertEquals(DocumentKind.CREDIT_NOTE, nc.kind());
        assertLines(nc, "Réduction invité d'honneur | 1 | -100.00");
        assertMoney("100.00", caseOf(p).credit());
    }
}
