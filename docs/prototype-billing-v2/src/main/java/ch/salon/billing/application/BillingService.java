package ch.salon.billing.application;

import ch.salon.billing.domain.BillingCase;
import ch.salon.billing.domain.BillingDocument;
import ch.salon.billing.domain.BillingEvent;
import ch.salon.billing.domain.ChargeSpec;
import ch.salon.billing.domain.Debtor;
import ch.salon.billing.domain.DocumentNumberSequence;
import ch.salon.billing.domain.Money;
import ch.salon.billing.domain.Payment;
import ch.salon.billing.domain.PaymentMode;
import ch.salon.billing.domain.PendingLine;
import ch.salon.billing.domain.Refund;
import ch.salon.billing.domain.SourceRef;
import ch.salon.billing.domain.SyncResult;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Point d'entrée du module de facturation (le « contrat »). Générique : les dossiers sont
 * identifiés par une {@link SourceRef} (type + identifiant) choisie par l'appelant, par exemple
 * ("PARTICIPATION", id) aujourd'hui, ("SPONSORING", id) demain.
 * <p>
 * Version en mémoire, sans Spring ni JPA : elle porte la logique et sert de spécification
 * exécutable. L'adaptateur JPA remplacera la Map par un repository, sans changer le contrat.
 */
public class BillingService {

    private final Map<SourceRef, BillingCase> cases = new LinkedHashMap<>();
    private final DocumentNumberSequence sequence;
    private final Supplier<LocalDate> today;
    private final int defaultPaymentTermDays;
    private final Consumer<BillingEvent> publisher;

    public BillingService(DocumentNumberSequence sequence, Supplier<LocalDate> today, int defaultPaymentTermDays,
                          Consumer<BillingEvent> publisher) {
        this.sequence = sequence;
        this.today = today;
        this.defaultPaymentTermDays = defaultPaymentTermDays;
        this.publisher = publisher;
    }

    /** Ouvre le dossier, ou le retourne s'il existe déjà (idempotent). Met à jour le débiteur. */
    public BillingCase openCase(SourceRef source, Debtor debtor) {
        BillingCase billingCase = cases.computeIfAbsent(source, ref -> new BillingCase(ref, debtor));
        billingCase.changeDebtor(debtor);
        return billingCase;
    }

    public SyncResult syncCharges(SourceRef source, List<ChargeSpec> desired) {
        return caseOf(source).syncCharges(desired);
    }

    public List<PendingLine> preview(SourceRef source) {
        return caseOf(source).pendingLines();
    }

    public Optional<BillingDocument> issue(SourceRef source, IssueRequest request) {
        LocalDate issueDate = today.get();
        LocalDate due = request.dueDate() != null ? request.dueDate() : issueDate.plusDays(defaultPaymentTermDays);
        BillingCase billingCase = caseOf(source);
        Optional<BillingDocument> document = billingCase.issue(request.group(), issueDate, due, sequence);
        publish(billingCase);
        return document;
    }

    /** Émet un document par groupe ayant quelque chose à facturer. */
    public List<BillingDocument> issueAll(SourceRef source, LocalDate dueDate) {
        List<BillingDocument> issued = new ArrayList<>();
        for (String group : caseOf(source).pendingGroups()) {
            issue(source, new IssueRequest(group, dueDate)).ifPresent(issued::add);
        }
        return issued;
    }

    /** Émet une facture d'acompte (montant et échéance décidés par l'appelant). */
    public BillingDocument requestDeposit(SourceRef source, String label, Money amount, String group,
                                          LocalDate dueDate) {
        BillingCase billingCase = caseOf(source);
        LocalDate issueDate = today.get();
        BillingDocument deposit = billingCase.requestDeposit(label, amount, group, issueDate,
                dueDate != null ? dueDate : issueDate.plusDays(defaultPaymentTermDays), sequence);
        publish(billingCase);
        return deposit;
    }

    /** Annule les acomptes non déduits : la part impayée est soldée, la part payée devient un avoir. */
    public List<BillingDocument> cancelDeposits(SourceRef source, String reason) {
        BillingCase billingCase = caseOf(source);
        List<BillingDocument> notes = billingCase.cancelDeposits(reason, today.get(), sequence);
        publish(billingCase);
        return notes;
    }

    /** Tâche quotidienne : publie DocumentOverdue pour chaque document qui vient de passer en retard. */
    public void scanOverdue() {
        for (BillingCase billingCase : cases.values()) {
            billingCase.scanOverdue(today.get());
            publish(billingCase);
        }
    }

    public Optional<Payment> recordPayment(SourceRef source, Money amount, PaymentMode mode, String targetDocument) {
        BillingCase billingCase = caseOf(source);
        Optional<Payment> payment = billingCase.recordPayment(today.get(), amount, mode, null, targetDocument);
        publish(billingCase);
        return payment;
    }

    public Refund refund(SourceRef source, Money amount, String reason) {
        BillingCase billingCase = caseOf(source);
        Refund refund = billingCase.refund(today.get(), amount, reason);
        publish(billingCase);
        return refund;
    }

    /** Rapproche les avis bancaires (camt.054) grâce à la référence RF imprimée dans le QR. */
    public ImportResult importBankNotifications(List<BankNotification> notifications) {
        List<BankNotification> matched = new ArrayList<>();
        List<BankNotification> duplicates = new ArrayList<>();
        List<BankNotification> unmatched = new ArrayList<>();
        for (BankNotification n : notifications) {
            Optional<Map.Entry<BillingCase, BillingDocument>> found = findByQrReference(n.creditorReference());
            if (found.isEmpty()) {
                unmatched.add(n);
                continue;
            }
            BillingCase billingCase = found.get().getKey();
            Optional<Payment> payment = billingCase.recordPayment(n.bookingDate(), n.amount(), PaymentMode.BANK,
                    n.bankReference(), found.get().getValue().number());
            (payment.isPresent() ? matched : duplicates).add(n);
            publish(billingCase);
        }
        return new ImportResult(matched, duplicates, unmatched);
    }

    public BillingCase caseOf(SourceRef source) {
        BillingCase billingCase = cases.get(source);
        if (billingCase == null) {
            throw new IllegalArgumentException("Dossier inconnu : " + source);
        }
        return billingCase;
    }

    private Optional<Map.Entry<BillingCase, BillingDocument>> findByQrReference(String reference) {
        if (reference == null) {
            return Optional.empty();
        }
        for (BillingCase billingCase : cases.values()) {
            Optional<BillingDocument> doc = billingCase.documentByQrReference(reference);
            if (doc.isPresent()) {
                return Optional.of(Map.entry(billingCase, doc.get()));
            }
        }
        return Optional.empty();
    }

    private void publish(BillingCase billingCase) {
        billingCase.pullEvents().forEach(publisher);
    }
}
