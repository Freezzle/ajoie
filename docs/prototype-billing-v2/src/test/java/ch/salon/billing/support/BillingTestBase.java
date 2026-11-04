package ch.salon.billing.support;

import ch.salon.billing.application.BankNotification;
import ch.salon.billing.application.BillingService;
import ch.salon.billing.application.ImportResult;
import ch.salon.billing.domain.BillingCase;
import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.Debtor;
import ch.salon.billing.domain.DocumentLine;
import ch.salon.billing.domain.InMemoryDocumentNumberSequence;
import ch.salon.billing.domain.Money;
import ch.salon.billing.domain.SyncResult;
import org.junit.jupiter.api.BeforeEach;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Socle des scénarios : un module « participations » simulé qui pousse ses besoins vers la
 * facturation, une horloge maîtrisée et le journal des événements publiés.
 */
public abstract class BillingTestBase {

    protected LocalDate today;
    protected BillingService billing;
    protected FakeParticipationBillingPolicy policy;
    protected List<BillingEvent> events;
    /** Modules abonnés aux événements de la facturation (ex. le workflow des participations). */
    protected List<java.util.function.Consumer<BillingEvent>> listeners;
    private int bankSeq;

    public static final Debtor DUPONT = new Debtor("Boulangerie Dupont SA", "Rue du Marché", "12", "2900",
            "Porrentruy", "CH", "fr");

    @BeforeEach
    void setUpBilling() {
        today = LocalDate.of(2027, 1, 10);
        events = new ArrayList<>();
        listeners = new ArrayList<>();
        policy = new FakeParticipationBillingPolicy();
        billing = new BillingService(new InMemoryDocumentNumberSequence(), () -> today, 30, e -> {
            events.add(e);
            listeners.forEach(l -> l.accept(e));
        });
    }

    protected void on(int year, int month, int day) {
        today = LocalDate.of(year, month, day);
    }

    protected void on(int month, int day) {
        on(2027, month, day);
    }

    /** Ce que ferait l'écouteur des changements de participation. */
    protected SyncResult sync(FakeParticipation p) {
        billing.openCase(p.caseRef(), DUPONT);
        return billing.syncCharges(p.caseRef(), policy.desiredCharges(p));
    }

    protected Optional<BillingDocument> issue(FakeParticipation p, String group) {
        return billing.issue(p.caseRef(), policy.issueRequest(p, group));
    }

    protected BillingDocument issueOrFail(FakeParticipation p, String group) {
        return issue(p, group).orElseThrow(() -> new AssertionError("Rien à émettre pour le groupe " + group));
    }

    /** Un virement arrive par l'avis bancaire camt.054, avec la référence QR du document. */
    protected ImportResult bankTransfer(BillingDocument document, String amount) {
        return billing.importBankNotifications(List.of(new BankNotification("BANK-" + (++bankSeq), today,
                Money.chf(amount), document.qrReference())));
    }

    protected BillingCase caseOf(FakeParticipation p) {
        return billing.caseOf(p.caseRef());
    }

    protected static Money chf(String amount) {
        return Money.chf(amount);
    }

    protected static void assertMoney(String expected, Money actual) {
        assertEquals(Money.chf(expected), actual);
    }

    protected static void assertLines(BillingDocument doc, String... expected) {
        List<String> actual = doc.lines().stream()
                                 .map(l -> l.displayLabel() + " | " + l.quantity().stripTrailingZeros().toPlainString()
                                         + " | " + l.amount())
                                 .toList();
        assertEquals(List.of(expected), actual, "Lignes de " + doc.number());
    }

    protected long count(Class<? extends BillingEvent> type) {
        return events.stream().filter(type::isInstance).count();
    }

    protected static Money sumLines(BillingDocument doc) {
        return doc.lines().stream().map(DocumentLine::amount).reduce(Money.ZERO, Money::plus);
    }
}
