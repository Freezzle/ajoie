package ch.salon.billing;

import ch.salon.billing.domain.BillingCase;
import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.ChargeSpec;
import ch.salon.billing.domain.DocumentLine;
import ch.salon.billing.domain.Money;
import ch.salon.billing.domain.PaymentMode;
import ch.salon.billing.domain.Variant;
import ch.salon.billing.support.BillingTestBase;
import ch.salon.billing.support.FakeParticipation;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test « au hasard » : 300 vies de participation, chacune avec 60 opérations tirées au sort
 * (changements, émissions, paiements, remboursements, annulations). Après CHAQUE opération les
 * invariants sont vérifiés ; à la fin, après une dernière émission, la facturation doit
 * correspondre exactement à ce que la participation attend.
 */
@DisplayName("Robustesse : séquences aléatoires d'opérations")
class RandomizedInvariantsTest extends BillingTestBase {

    private static final String[] DIMENSIONS = {"2x2", "3x3", "3x4"};

    @Test
    @DisplayName("300 vies aléatoires : invariants à chaque pas, convergence et solde final à zéro")
    void randomLives() {
        for (int seed = 1; seed <= 300; seed++) {
            setUpBillingForSeed();
            runLife(seed);
        }
        // Le test doit réellement explorer les cas délicats, pas seulement des chemins triviaux.
        assertTrue(invoices > 1000, "factures émises : " + invoices);
        assertTrue(creditNotes > 200, "notes de crédit : " + creditNotes);
        assertTrue(reversals > 500, "lignes d'annulation : " + reversals);
        assertTrue(adjustments > 200, "lignes de modification de quantité : " + adjustments);
        assertTrue(refunds > 50, "remboursements : " + refunds);
        assertTrue(deposits > 200, "acomptes : " + deposits);
        assertTrue(deductions > 50, "déductions d'acompte : " + deductions);
        assertTrue(partialOrOver > 300, "paiements partiels ou en trop : " + partialOrOver);
        System.out.printf("    (exploré : %d factures, %d notes de crédit, %d acomptes, %d déductions, %d annulations, %d modifications, %d remboursements, %d paiements partiels/en trop)%n",
                invoices, creditNotes, deposits, deductions, reversals, adjustments, refunds, partialOrOver);
    }

    private int invoices, creditNotes, reversals, adjustments, refunds, partialOrOver, deductions;
    private long deposits;

    private void setUpBillingForSeed() {
        today = java.time.LocalDate.of(2027, 1, 10);
        events.clear();
    }

    private void runLife(int seed) {
        Random rnd = new Random(seed);
        FakeParticipation p = new FakeParticipation("R-" + seed).stand("S1", DIMENSIONS[rnd.nextInt(3)]);
        sync(p);
        BillingCase c = caseOf(p);

        for (int step = 0; step < 60; step++) {
            today = today.plusDays(rnd.nextInt(4));
            String what;
            switch (rnd.nextInt(17)) {
                case 0 -> { p.resizeStand("S1", DIMENSIONS[rnd.nextInt(3)]); sync(p); what = "resize"; }
                case 1 -> { p.electricity("S1", rnd.nextBoolean()); sync(p); what = "elec"; }
                case 2 -> { p.tables("S1", rnd.nextInt(5)); sync(p); what = "tables"; }
                case 3 -> { p.mealsSaturday(rnd.nextInt(5)); p.mealsSunday(rnd.nextInt(3)); sync(p); what = "meals"; }
                case 4 -> { p.mealsSeparate(rnd.nextBoolean()); sync(p); what = "mealsGroup"; }
                case 5 -> { p.postal(rnd.nextBoolean()); p.guestOfHonor(rnd.nextInt(4) == 0); sync(p); what = "postal/guest"; }
                case 6 -> {
                    if (p.standCount() == 1) { p.stand("S2", DIMENSIONS[rnd.nextInt(3)]); } else { p.removeStand("S2"); }
                    sync(p); what = "stand2";
                }
                case 7 -> {
                    if (rnd.nextInt(3) == 0) { p.cancelWithFee(rnd.nextBoolean() ? "50.00" : null); } else { p.reinstate(); }
                    sync(p); what = "cancel/reinstate";
                }
                case 8, 9 -> { billing.issueAll(p.caseRef(), null); what = "issueAll"; }
                case 10, 11 -> { payRandomly(rnd, c); what = "pay"; }
                case 12 -> {
                    if (c.credit().isPositive()) {
                        billing.refund(p.caseRef(), c.credit(), "test");
                    }
                    what = "refund";
                }
                case 13, 14 -> {
                    billing.requestDeposit(p.caseRef(), "Acompte", Money.chf(String.valueOf(50 + rnd.nextInt(250))),
                            rnd.nextInt(4) == 0 ? "meals" : "main", null);
                    what = "deposit";
                }
                case 15 -> { billing.cancelDeposits(p.caseRef(), "test"); what = "cancelDeposits"; }
                default -> { sync(p); what = "resync"; }
            }
            checkStep(c, p, "seed " + seed + " pas " + step + " (" + what + ")");
        }

        // Fin : on émet tout ce qui reste, on libère les acomptes non déduits, puis on règle le solde.
        billing.issueAll(p.caseRef(), null);
        billing.cancelDeposits(p.caseRef(), "fin");
        String ctx = "seed " + seed + " (fin)";
        assertTrue(billing.preview(p.caseRef()).isEmpty(), ctx + " : il reste des lignes à facturer");
        assertBilledEqualsDesired(c, policy.desiredCharges(p), ctx);

        for (BillingDocument d : c.documents()) {
            if (d.isInvoice()) { invoices++; } else { creditNotes++; }
            for (DocumentLine l : d.lines()) {
                if (l.type() == ch.salon.billing.domain.LineType.REVERSAL) { reversals++; }
                if (l.type() == ch.salon.billing.domain.LineType.ADJUSTMENT) { adjustments++; }
                if (l.type() == ch.salon.billing.domain.LineType.DEPOSIT_DEDUCTION) { deductions++; }
            }
        }
        refunds += c.refunds().size();
        if (c.balance().isPositive()) {
            billing.recordPayment(p.caseRef(), c.balance(), PaymentMode.BANK, null);
        } else if (c.credit().isPositive()) {
            billing.refund(p.caseRef(), c.credit(), "solde");
        }
        checkStep(c, p, ctx);
        assertMoney("0.00", c.balance());
        if (!c.documents().isEmpty()) {
            assertTrue(c.isSettled(), ctx + " : dossier non soldé");
            assertTrue(c.isFullyClosed(), ctx + " : dossier non clôturable");
            deposits += c.documents().stream().filter(BillingDocument::isDeposit).count();
        }
    }

    private void payRandomly(Random rnd, BillingCase c) {
        List<BillingDocument> open = c.documents().stream()
                                      .filter(d -> d.isInvoice() && c.openAmount(d.number()).isPositive()).toList();
        if (open.isEmpty()) {
            if (rnd.nextInt(5) == 0) { // prépaiement occasionnel
                billing.recordPayment(c.ref(), Money.chf("20.00"), PaymentMode.BANK, null);
            }
            return;
        }
        BillingDocument target = open.get(rnd.nextInt(open.size()));
        Money due = c.openAmount(target.number());
        // tantôt exact, tantôt partiel, tantôt trop
        BigDecimal factor = switch (rnd.nextInt(3)) {
            case 0 -> BigDecimal.ONE;
            case 1 -> new BigDecimal("0.4");
            default -> new BigDecimal("1.3");
        };
        Money amount = due.times(factor);
        if (factor.compareTo(BigDecimal.ONE) != 0) {
            partialOrOver++;
        }
        if (amount.isPositive()) {
            bankTransfer(target, amount.toString());
        }
    }

    private void checkStep(BillingCase c, FakeParticipation p, String ctx) {
        c.checkInvariants();
        assertEquals(c.ledgerBalance(), c.balance(), ctx + " : solde incohérent");
        boolean hasOpen = c.documents().stream().anyMatch(d -> d.isInvoice() && c.openAmount(d.number()).isPositive());
        assertFalse(hasOpen && c.credit().isPositive(), ctx + " : avoir non utilisé alors qu'une facture est ouverte");
        for (BillingDocument d : c.documents()) {
            assertEquals(sumLines(d), d.total(), ctx + " : total ≠ somme des lignes " + d.number());
            assertEquals(d.isCreditNote(), d.total().isNegative(), ctx + " : type incohérent " + d.number());
            if (d.isDeposit()) {
                assertTrue(c.depositPaid(d).compareTo(d.total()) <= 0, ctx + " : acompte sur-payé " + d.number());
            }
        }
        // Les PRESTATIONS émises + à facturer doivent toujours égaler ce que la participation attend
        // (les lignes d'acompte et de déduction ne sont pas des prestations).
        Money issued = chargesIssued(c);
        Money pending = c.pendingLines().stream().map(l -> l.amount()).reduce(Money.ZERO, Money::plus);
        Money desiredTotal = policy.desiredCharges(p).stream().map(ChargeSpec::amount).reduce(Money.ZERO, Money::plus);
        assertEquals(desiredTotal, issued.plus(pending), ctx + " : émis + à facturer ≠ attendu");
    }

    private void assertBilledEqualsDesired(BillingCase c, List<ChargeSpec> desired, String ctx) {
        Map<String, LinkedHashMap<Variant, BigDecimal>> billed = c.billedPositions();
        Map<String, LinkedHashMap<Variant, BigDecimal>> expected = new LinkedHashMap<>();
        for (ChargeSpec spec : desired) {
            LinkedHashMap<Variant, BigDecimal> m = new LinkedHashMap<>();
            m.put(spec.variant(), spec.quantity());
            expected.put(spec.key(), m);
        }
        assertEquals(new ArrayList<>(expected.keySet()).stream().sorted().toList(),
                new ArrayList<>(billed.keySet()).stream().sorted().toList(), ctx + " : clés facturées");
        for (var e : expected.entrySet()) {
            var actual = billed.get(e.getKey());
            assertEquals(1, actual.size(), ctx + " : plusieurs variantes actives pour " + e.getKey());
            var variant = e.getValue().keySet().iterator().next();
            assertEquals(0, e.getValue().get(variant).compareTo(actual.get(variant)), ctx + " : quantité " + e.getKey());
        }
        Money expectedTotal = desired.stream().map(ChargeSpec::amount).reduce(Money.ZERO, Money::plus);
        assertEquals(expectedTotal, chargesIssued(c), ctx + " : prestations émises ≠ attendu");
    }

    private Money chargesIssued(BillingCase c) {
        return c.documents().stream().flatMap(d -> d.lines().stream()).filter(l -> l.type().isCharge())
                .map(DocumentLine::amount).reduce(Money.ZERO, Money::plus);
    }
}
