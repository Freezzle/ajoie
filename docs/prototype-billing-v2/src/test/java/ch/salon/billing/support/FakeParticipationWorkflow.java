package ch.salon.billing.support;

import ch.salon.billing.application.BillingService;
import ch.salon.billing.domain.BillingCase;
import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.DocumentKind;
import ch.salon.billing.domain.Money;
import ch.salon.billing.support.FakeParticipation.BillingProcess;
import ch.salon.billing.support.FakeParticipation.FakeStand;
import ch.salon.billing.support.FakeParticipation.Status;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import static ch.salon.billing.support.FakeParticipationBillingPolicy.MAIN;

/**
 * Ce que feraient, dans l'application, les actions sur les participations (accepter, valider,
 * annuler…) et l'écouteur des événements de la facturation.
 * <p>
 * C'est ICI que vivent les règles de cycle de vie ; la facturation ne fait qu'exécuter et
 * prévenir. Chaque méthode publique correspond à une action d'admin ou à un événement reçu.
 */
public class FakeParticipationWorkflow {

    public static final String SOURCE_TYPE = "PARTICIPATION";
    public static final int DEPOSIT_TERM_DAYS = 20;

    /** Décision prise par l'admin au moment d'annuler (règlement exposants). */
    public record CancellationDecision(String cancellationFee, boolean keepPaidDeposit, boolean refundCredit) {
        public static CancellationDecision refundEverything() {
            return new CancellationDecision(null, false, true);
        }

        public static CancellationDecision keepDeposit() {
            return new CancellationDecision(null, true, true);
        }

        public static CancellationDecision fee(String amount) {
            return new CancellationDecision(amount, false, true);
        }
    }

    private final BillingService billing;
    private final FakeParticipationBillingPolicy policy;
    private final Supplier<LocalDate> today;
    private final Map<String, FakeParticipation> registry = new HashMap<>();

    public FakeParticipationWorkflow(BillingService billing, FakeParticipationBillingPolicy policy,
                                     Supplier<LocalDate> today) {
        this.billing = billing;
        this.policy = policy;
        this.today = today;
    }

    public FakeParticipation register(FakeParticipation p) {
        registry.put(p.id, p);
        p.log.add("Inscription reçue (" + p.process + ")");
        return p;
    }

    // ------------------------------------------------------------------ actions admin

    /** Choisir acompte / normal : seulement tant qu'aucun acompte n'a été émis. */
    public void switchProcess(FakeParticipation p, BillingProcess process) {
        requireStatus(p, Status.IN_VERIFICATION, Status.ACCEPTED);
        if (p.process == process) {
            return;
        }
        if (hasCase(p) && billingCase(p).documents().stream().anyMatch(BillingDocument::isDeposit)
                && billingCase(p).undeductedDeposits().isPositive()) {
            throw new IllegalStateException("Un acompte a déjà été encaissé : annulez-le ou remboursez-le d'abord");
        }
        if (hasCase(p) && billingCase(p).documents().stream().anyMatch(d -> d.isDeposit()
                && billingCase(p).openAmount(d.number()).isPositive())) {
            billing.cancelDeposits(p.caseRef(), "Passage en facturation normale");
        }
        p.process = process;
        p.log.add("Processus de facturation : " + process);
        if (process == BillingProcess.DEPOSIT && p.status == Status.ACCEPTED) {
            requestDeposit(p);
        }
    }

    /**
     * En vérification → acceptée : les sous-objets en vérification passent à « accepté », les
     * prestations deviennent « à facturer » (brouillon, rien n'est envoyé). En processus acompte,
     * la facture d'acompte est émise.
     */
    public void accept(FakeParticipation p) {
        requireStatus(p, Status.IN_VERIFICATION);
        p.stands.stream().filter(s -> s.status == Status.IN_VERIFICATION).forEach(s -> s.status = Status.ACCEPTED);
        p.status = Status.ACCEPTED;
        p.log.add("Acceptée");
        push(p);
        if (p.process == BillingProcess.DEPOSIT) {
            requestDeposit(p);
        }
    }

    public void refuse(FakeParticipation p) {
        requireStatus(p, Status.IN_VERIFICATION);
        p.stands.forEach(s -> s.status = Status.REFUSED);
        p.status = Status.REFUSED;
        p.log.add("Refusée");
    }

    /** Acceptée → validée (automatique sur événement, ou forcée par l'admin). */
    public void validate(FakeParticipation p, String reason) {
        requireStatus(p, Status.ACCEPTED);
        p.stands.stream().filter(s -> s.status == Status.ACCEPTED).forEach(s -> s.status = Status.VALIDATED);
        p.status = Status.VALIDATED;
        p.depositOverdue = false;
        p.log.add("Validée : " + reason);
    }

    /** Un sous-objet demandé après coup est accepté ; si la participation est validée, il l'est aussi. */
    public void acceptStand(FakeParticipation p, String standId) {
        requireStatus(p, Status.ACCEPTED, Status.VALIDATED);
        FakeStand stand = p.find(standId);
        if (stand.status != Status.IN_VERIFICATION) {
            throw new IllegalStateException("Stand déjà traité");
        }
        stand.status = p.status == Status.VALIDATED ? Status.VALIDATED : Status.ACCEPTED;
        push(p);
    }

    /** Toute modification de la participation se termine par cet appel. */
    public void changed(FakeParticipation p) {
        push(p);
    }

    /** Émission des factures (action admin, ou planifiée X jours avant le salon). */
    public List<BillingDocument> issueInvoices(FakeParticipation p) {
        requireStatus(p, Status.ACCEPTED, Status.VALIDATED);
        List<BillingDocument> issued = new ArrayList<>();
        for (String group : billingCase(p).pendingGroups()) {
            billing.issue(p.caseRef(), policy.issueRequest(p, group)).ifPresent(issued::add);
        }
        return issued;
    }

    /**
     * Annulation, quel que soit l'état de la facturation. La participation passe immédiatement à
     * « annulée » ; la facturation régularise : notes de crédit, frais éventuels, acomptes, avoir.
     */
    public void cancel(FakeParticipation p, CancellationDecision decision) {
        requireStatus(p, Status.IN_VERIFICATION, Status.ACCEPTED, Status.VALIDATED);
        if (!today.get().isBefore(p.salonDate)) {
            throw new IllegalStateException("Salon commencé : pas d'annulation, utiliser une note de crédit manuelle");
        }
        // Acompte conservé = frais d'annulation égaux à ce qui a été versé en acompte.
        Money retained = Money.ZERO;
        if (hasCase(p) && decision.keepPaidDeposit()) {
            for (BillingDocument d : billingCase(p).documents()) {
                if (d.isDeposit()) {
                    retained = retained.plus(billingCase(p).depositPaid(d));
                }
            }
        }
        Money fee = decision.cancellationFee() != null ? Money.chf(decision.cancellationFee()) : Money.ZERO;
        Money totalFee = fee.plus(retained);

        p.stands.forEach(s -> s.status = Status.CANCELED);
        p.status = Status.CANCELED;
        p.cancelled = true;
        p.cancellationFee = totalFee.isPositive() ? totalFee.toString() : null;
        p.log.add("Annulée" + (totalFee.isPositive() ? " (frais retenus " + totalFee + ")" : ""));

        if (!hasCase(p)) {
            return; // jamais rien envoyé à la facturation
        }
        push(p);
        for (String group : billingCase(p).pendingGroups()) {
            billing.issue(p.caseRef(), policy.issueRequest(p, group));
        }
        billing.cancelDeposits(p.caseRef(), "Annulation de la participation");
        Money credit = billingCase(p).credit();
        if (decision.refundCredit() && credit.isPositive()) {
            billing.refund(p.caseRef(), credit, "Annulation de la participation");
        }
    }

    public boolean canClose(FakeParticipation p) {
        return p.status == Status.VALIDATED && today.get().isAfter(p.salonDate) && billingCase(p).isFullyClosed();
    }

    public void close(FakeParticipation p) {
        if (!canClose(p)) {
            throw new IllegalStateException("Clôture impossible : salon pas terminé ou facturation non soldée");
        }
        p.stands.stream().filter(s -> s.status == Status.VALIDATED).forEach(s -> s.status = Status.CLOSED);
        p.status = Status.CLOSED;
        p.log.add("Clôturée");
    }

    // ------------------------------------------------------------------ réactions aux événements

    /** Écouteur des événements de la facturation : ne traite que les sources PARTICIPATION. */
    public void onBillingEvent(BillingEvent event) {
        if (!event.source().is(SOURCE_TYPE)) {
            return;
        }
        FakeParticipation p = registry.get(event.source().id());
        if (p == null) {
            return;
        }
        switch (event) {
            // Processus acompte : l'acompte PAYÉ (pas simplement annulé) valide la participation.
            case BillingEvent.DocumentSettled s when s.kind() == DocumentKind.DEPOSIT && s.paid()
                    && p.process == BillingProcess.DEPOSIT && p.status == Status.ACCEPTED ->
                    validate(p, "acompte " + s.number() + " reçu");
            // Dans les deux processus : une facture payée valide la participation encore « acceptée ».
            case BillingEvent.DocumentSettled s when s.kind() == DocumentKind.INVOICE && s.paid()
                    && p.status == Status.ACCEPTED ->
                    validate(p, "facture " + s.number() + " payée");
            case BillingEvent.DocumentIssued i when i.kind() == DocumentKind.INVOICE && p.arrangement
                    && p.process == BillingProcess.STANDARD && p.status == Status.ACCEPTED ->
                    validate(p, "arrangement : facture " + i.number() + " émise");
            case BillingEvent.DocumentOverdue o when o.kind() == DocumentKind.DEPOSIT && p.status == Status.ACCEPTED -> {
                p.depositOverdue = true;
                p.log.add("Acompte " + o.number() + " en retard : à relancer, stand réservé jusqu'à décision");
            }
            case BillingEvent.CaseSettled c -> p.billingSettled = true;
            case BillingEvent.DocumentIssued i when i.kind() != DocumentKind.CREDIT_NOTE -> p.billingSettled = false;
            default -> { }
        }
    }

    // ------------------------------------------------------------------ interne

    private void requestDeposit(FakeParticipation p) {
        billing.requestDeposit(p.caseRef(), "Acompte participation salon " + p.salonDate.getYear(),
                policy.depositAmount(p), MAIN, today.get().plusDays(DEPOSIT_TERM_DAYS));
    }

    private void push(FakeParticipation p) {
        billing.openCase(p.caseRef(), BillingTestBase.DUPONT);
        billing.syncCharges(p.caseRef(), policy.desiredCharges(p));
    }

    private boolean hasCase(FakeParticipation p) {
        try {
            billing.caseOf(p.caseRef());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private BillingCase billingCase(FakeParticipation p) {
        return billing.caseOf(p.caseRef());
    }

    private static void requireStatus(FakeParticipation p, Status... allowed) {
        for (Status s : allowed) {
            if (p.status == s) {
                return;
            }
        }
        throw new IllegalStateException("Action impossible au statut " + p.status);
    }
}
