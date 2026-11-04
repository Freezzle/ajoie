package ch.salon.billing;

import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.ChargeKind;
import ch.salon.billing.domain.ChargeSpec;
import ch.salon.billing.domain.LineType;
import ch.salon.billing.domain.PendingLine;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;
import static ch.salon.billing.support.FakeParticipationBillingPolicy.MEALS;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("Synchronisation : attendu − déjà facturé = à facturer")
class SyncRulesTest extends BillingTestBase {

    FakeParticipation p;

    @BeforeEach
    void participation() {
        p = new FakeParticipation("P-100").stand("S1", "3x3").electricity("S1", true).tables("S1", 2).mealsSaturday(2);
    }

    @Nested
    @DisplayName("Avant toute émission")
    class BeforeIssuing {

        @Test
        @DisplayName("envoyer deux fois la même liste ne change rien (idempotence)")
        void idempotent() {
            assertTrue(sync(p).changed());
            List<PendingLine> first = billing.preview(p.caseRef());
            assertFalse(sync(p).changed());
            assertEquals(first, billing.preview(p.caseRef()));
        }

        @Test
        @DisplayName("l'ordre des postes envoyés n'a pas d'importance")
        void orderDoesNotMatter() {
            sync(p);
            List<ChargeSpec> reversed = new ArrayList<>(policy.desiredCharges(p));
            Collections.reverse(reversed);
            assertFalse(billing.syncCharges(p.caseRef(), reversed).changed());
        }

        @Test
        @DisplayName("une modification met à jour la ligne à facturer, sans créer de document")
        void updateBeforeIssue() {
            sync(p);
            p.tables("S1", 4).resizeStand("S1", "3x4");
            sync(p);
            List<PendingLine> main = caseOf(p).pendingLines(MAIN);
            assertEquals(List.of("Stand 3x4 m", "Électricité 230 V", "Table supplémentaire"),
                    main.stream().map(PendingLine::displayLabel).toList());
            assertTrue(main.stream().allMatch(l -> l.type() == LineType.NEW));
            assertMoney("60.00", main.get(2).amount());
            assertTrue(caseOf(p).documents().isEmpty());
        }

        @Test
        @DisplayName("un poste retiré avant émission disparaît simplement")
        void removeBeforeIssue() {
            sync(p);
            p.electricity("S1", false).mealsSaturday(0);
            sync(p);
            assertEquals(2, billing.preview(p.caseRef()).size());
            assertTrue(caseOf(p).pendingGroups().contains(MAIN));
            assertFalse(caseOf(p).pendingGroups().contains(MEALS));
        }

        @Test
        @DisplayName("ajouter puis retirer avant émission ne laisse aucune trace")
        void pingPongBeforeIssue() {
            sync(p);
            p.mealsSunday(3);
            sync(p);
            p.mealsSunday(0);
            sync(p);
            assertEquals(4, billing.preview(p.caseRef()).size());
        }
    }

    @Nested
    @DisplayName("Après émission")
    class AfterIssuing {

        BillingDocument f1;
        BillingDocument f2;

        @BeforeEach
        void issued() {
            sync(p);
            f1 = issueOrFail(p, MAIN);
            f2 = issueOrFail(p, MEALS);
        }

        @Test
        @DisplayName("tout est facturé : plus rien en attente")
        void nothingPending() {
            assertTrue(billing.preview(p.caseRef()).isEmpty());
            assertFalse(sync(p).changed());
        }

        @Test
        @DisplayName("seule la quantité change → ligne de différence qui cite la facture d'origine")
        void quantityChange() {
            p.tables("S1", 5);
            sync(p);
            List<PendingLine> lines = billing.preview(p.caseRef());
            assertEquals(1, lines.size());
            PendingLine line = lines.get(0);
            assertEquals(LineType.ADJUSTMENT, line.type());
            assertEquals(0, line.quantity().compareTo(BigDecimal.valueOf(3)));
            assertMoney("45.00", line.amount());
            assertEquals("Table supplémentaire – modification de quantité (F-2027-0001)", line.displayLabel());
        }

        @Test
        @DisplayName("la prestation change (dimension) → annulation de l'ancienne ligne + nouvelle ligne")
        void variantChange() {
            p.resizeStand("S1", "2x2");
            sync(p);
            List<PendingLine> lines = billing.preview(p.caseRef());
            assertEquals(List.of(LineType.REVERSAL, LineType.NEW), lines.stream().map(PendingLine::type).toList());
            assertMoney("-450.00", lines.get(0).amount());
            assertMoney("300.00", lines.get(1).amount());
            assertEquals("Annulation : Stand 3x3 m (F-2027-0001)", lines.get(0).displayLabel());
        }

        @Test
        @DisplayName("le prix seul change → annulation + nouvelle ligne au nouveau prix")
        void priceChange() {
            List<ChargeSpec> charges = new ArrayList<>(policy.desiredCharges(p));
            charges.set(0, ChargeSpec.charge("stand:S1", "Stand 3x3 m").price("400.00").category("stand")
                                     .attribute("dimension", "3x3").build());
            billing.syncCharges(p.caseRef(), charges);
            List<PendingLine> lines = billing.preview(p.caseRef());
            assertEquals(2, lines.size());
            assertMoney("-50.00", lines.stream().map(PendingLine::amount).reduce(chf("0"), (a, b) -> a.plus(b)));
        }

        @Test
        @DisplayName("seul le prix catalogue change → rien à refacturer")
        void listPriceChangeIsIgnored() {
            List<ChargeSpec> charges = new ArrayList<>(policy.desiredCharges(p));
            charges.set(0, ChargeSpec.charge("stand:S1", "Stand 3x3 m").price("450.00").listPrice("500.00")
                                     .category("stand").attribute("dimension", "3x3").build());
            assertFalse(billing.syncCharges(p.caseRef(), charges).changed());
        }

        @Test
        @DisplayName("un poste retiré après émission → ligne d'annulation négative")
        void removedAfterIssue() {
            p.electricity("S1", false);
            sync(p);
            PendingLine line = billing.preview(p.caseRef()).get(0);
            assertEquals(LineType.REVERSAL, line.type());
            assertMoney("-35.00", line.amount());
        }

        @Test
        @DisplayName("retirer puis remettre avant la prochaine émission → rien à facturer")
        void pingPongAfterIssue() {
            p.electricity("S1", false);
            sync(p);
            p.electricity("S1", true);
            sync(p);
            assertTrue(billing.preview(p.caseRef()).isEmpty());
        }

        @Test
        @DisplayName("les repas changent de groupe → annulation dans « repas », nouvelle ligne dans « principal »")
        void groupChange() {
            p.mealsSeparate(false);
            sync(p);
            assertEquals(1, caseOf(p).pendingLines(MEALS).size());
            assertEquals(LineType.REVERSAL, caseOf(p).pendingLines(MEALS).get(0).type());
            assertEquals(1, caseOf(p).pendingLines(MAIN).size());
            assertEquals(LineType.NEW, caseOf(p).pendingLines(MAIN).get(0).type());
        }

        @Test
        @DisplayName("liste vide (tout retiré) → annulation de tout ce qui a été facturé")
        void emptyList() {
            billing.syncCharges(p.caseRef(), List.of());
            assertEquals(4, billing.preview(p.caseRef()).size());
            assertTrue(billing.preview(p.caseRef()).stream().allMatch(l -> l.type() == LineType.REVERSAL));
            assertMoney("-560.00", billing.preview(p.caseRef()).stream().map(PendingLine::amount)
                                          .reduce(chf("0"), (a, b) -> a.plus(b)));
        }
    }

    @Nested
    @DisplayName("Postes refusés à l'entrée")
    class Validation {

        @Test
        @DisplayName("clé en double dans la liste")
        void duplicateKey() {
            billing.openCase(p.caseRef(), DUPONT);
            ChargeSpec stand = ChargeSpec.charge("stand:S1", "Stand").price("450.00").build();
            assertThrows(IllegalArgumentException.class, () -> billing.syncCharges(p.caseRef(), List.of(stand, stand)));
        }

        @Test
        @DisplayName("quantité nulle ou négative")
        void zeroQuantity() {
            assertThrows(IllegalArgumentException.class,
                    () -> ChargeSpec.charge("meal:1", "Repas").quantity(0).price("22.50").build());
            assertThrows(IllegalArgumentException.class,
                    () -> ChargeSpec.charge("meal:1", "Repas").quantity(-1).price("22.50").build());
        }

        @Test
        @DisplayName("prix négatif hors réduction, ou réduction à prix positif")
        void priceSign() {
            assertThrows(IllegalArgumentException.class,
                    () -> ChargeSpec.charge("stand:S1", "Stand").price("-1.00").build());
            assertThrows(IllegalArgumentException.class,
                    () -> ChargeSpec.charge("discount", "Rabais").price("10.00").kind(ChargeKind.DISCOUNT).build());
        }

        @Test
        @DisplayName("clé, libellé ou groupe vides")
        void blanks() {
            assertThrows(IllegalArgumentException.class, () -> ChargeSpec.charge(" ", "Stand").price("1.00").build());
            assertThrows(IllegalArgumentException.class, () -> ChargeSpec.charge("k", "").price("1.00").build());
            assertThrows(IllegalArgumentException.class,
                    () -> ChargeSpec.charge("k", "Stand").price("1.00").group("").build());
        }

        @Test
        @DisplayName("un refus ne modifie pas l'état attendu précédent")
        void rejectedSyncKeepsState() {
            sync(p);
            List<PendingLine> before = billing.preview(p.caseRef());
            ChargeSpec stand = ChargeSpec.charge("stand:S1", "Stand").price("450.00").build();
            assertThrows(IllegalArgumentException.class, () -> billing.syncCharges(p.caseRef(), List.of(stand, stand)));
            assertEquals(before, billing.preview(p.caseRef()));
        }
    }
}
