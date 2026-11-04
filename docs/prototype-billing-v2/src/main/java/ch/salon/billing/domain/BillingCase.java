package ch.salon.billing.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;

/**
 * Dossier de facturation d'une {@link SourceRef} (ex. une participation). Agrégat qui garantit :
 * <ul>
 *   <li>« à facturer » = attendu − déjà facturé, recalculé à chaque lecture ;</li>
 *   <li>un document émis n'est jamais modifié ;</li>
 *   <li>l'argent (paiements, notes de crédit) est affecté aux documents à payer (factures et
 *       factures d'acompte), le surplus est un avoir ;</li>
 *   <li>un acompte encaissé est déduit de la facture suivante du même groupe ;</li>
 *   <li>solde = documents ouverts − avoir = documents − paiements + remboursements.</li>
 * </ul>
 * Il ne connaît rien du métier de l'appelant.
 */
public class BillingCase {

    private static final String DEPOSIT_KEY_PREFIX = "deposit:";

    private final SourceRef ref;
    private Debtor debtor;

    /** Dernier état attendu envoyé par l'appelant, dans l'ordre reçu. */
    private final Map<String, ChargeSpec> desired = new LinkedHashMap<>();

    private final List<BillingDocument> documents = new ArrayList<>();
    private final List<Payment> payments = new ArrayList<>();
    private final List<Refund> refunds = new ArrayList<>();
    private final List<Allocation> allocations = new ArrayList<>();
    private final List<BillingEvent> events = new ArrayList<>();
    private final Set<String> settledDocuments = new HashSet<>();
    private final Set<String> overdueAnnounced = new HashSet<>();
    private boolean settled;
    private Money lastAnnouncedCredit = Money.ZERO;
    private int paymentSeq;
    private int refundSeq;

    public BillingCase(SourceRef ref, Debtor debtor) {
        this.ref = Objects.requireNonNull(ref);
        this.debtor = debtor;
    }

    // ================================================================== attendu / à facturer

    /**
     * Remplace l'état attendu par la liste COMPLÈTE fournie. Appeler deux fois avec la même liste
     * ne change rien.
     */
    public SyncResult syncCharges(List<ChargeSpec> charges) {
        Objects.requireNonNull(charges, "charges");
        Map<String, ChargeSpec> next = new LinkedHashMap<>();
        for (ChargeSpec charge : charges) {
            if (charge.key().startsWith(DEPOSIT_KEY_PREFIX)) {
                throw new IllegalArgumentException("Le préfixe de clé '" + DEPOSIT_KEY_PREFIX + "' est réservé");
            }
            if (next.put(charge.key(), charge) != null) {
                throw new IllegalArgumentException("Clé en double dans les postes attendus : " + charge.key());
            }
        }
        List<PendingLine> before = pendingLines();
        desired.clear();
        desired.putAll(next);
        return new SyncResult(before, pendingLines());
    }

    /** Toutes les lignes « à facturer », tous groupes confondus. */
    public List<PendingLine> pendingLines() {
        Map<String, LinkedHashMap<Variant, BigDecimal>> billed = billedPositions();
        Set<String> keys = new LinkedHashSet<>(desired.keySet());
        keys.addAll(billed.keySet());

        List<PendingLine> result = new ArrayList<>();
        for (String key : keys) {
            ChargeSpec wanted = desired.get(key);
            Map<Variant, BigDecimal> already = billed.getOrDefault(key, new LinkedHashMap<>());

            // 1) Tout ce qui est facturé sous une autre variante (ou n'est plus voulu) est annulé.
            for (Map.Entry<Variant, BigDecimal> entry : already.entrySet()) {
                if (wanted == null || !entry.getKey().equals(wanted.variant())) {
                    result.add(new PendingLine(key, entry.getKey(), entry.getValue().negate(),
                            lastListPrice(key, entry.getKey()), LineType.REVERSAL,
                            documentsContaining(key, entry.getKey())));
                }
            }
            // 2) La variante voulue : nouvelle ligne ou variation de quantité.
            if (wanted != null) {
                BigDecimal alreadyBilled = already.getOrDefault(wanted.variant(), BigDecimal.ZERO);
                BigDecimal delta = wanted.quantity().subtract(alreadyBilled);
                if (delta.signum() != 0) {
                    boolean isNew = alreadyBilled.signum() == 0;
                    result.add(new PendingLine(key, wanted.variant(), delta, wanted.listPrice(),
                            isNew ? LineType.NEW : LineType.ADJUSTMENT,
                            isNew ? List.of() : documentsContaining(key, wanted.variant())));
                }
            }
        }
        return Collections.unmodifiableList(result);
    }

    public List<PendingLine> pendingLines(String group) {
        return pendingLines().stream().filter(l -> l.group().equals(group)).toList();
    }

    public Set<String> pendingGroups() {
        Set<String> groups = new LinkedHashSet<>();
        pendingLines().forEach(l -> groups.add(l.group()));
        return groups;
    }

    /** Prestations déjà facturées, par clé puis par variante (quantité nette, sans les variantes à 0). */
    public Map<String, LinkedHashMap<Variant, BigDecimal>> billedPositions() {
        Map<String, LinkedHashMap<Variant, BigDecimal>> billed = new LinkedHashMap<>();
        for (BillingDocument doc : documents) {
            for (DocumentLine line : doc.lines()) {
                if (line.type().isCharge()) {
                    billed.computeIfAbsent(line.key(), k -> new LinkedHashMap<>())
                          .merge(line.variant(), line.quantity(), BigDecimal::add);
                }
            }
        }
        billed.values().forEach(m -> m.values().removeIf(q -> q.signum() == 0));
        billed.values().removeIf(Map::isEmpty);
        return billed;
    }

    private List<String> documentsContaining(String key, Variant variant) {
        return documents.stream()
                        .filter(d -> d.lines().stream().anyMatch(l -> l.type().isCharge() && l.key().equals(key)
                                && l.variant().equals(variant)))
                        .map(BillingDocument::number).distinct().toList();
    }

    private Money lastListPrice(String key, Variant variant) {
        Money price = variant.unitPrice();
        for (BillingDocument doc : documents) {
            for (DocumentLine line : doc.lines()) {
                if (line.key().equals(key) && line.variant().equals(variant)
                        && (line.type() == LineType.NEW || line.type() == LineType.ADJUSTMENT)) {
                    price = line.listPrice();
                }
            }
        }
        return price;
    }

    // ================================================================== émission

    /**
     * Émet un document avec toutes les lignes « à facturer » du groupe. Le type est déduit du
     * total : positif ou nul → facture, négatif → note de crédit.
     * <p>
     * Si le groupe a des acomptes : la facture déduit ce qui a été ENCAISSÉ et pas encore déduit
     * (sans jamais devenir négative) ; la part d'acompte non payée est annulée par une note de
     * crédit, pour que l'exposant n'ait qu'un montant à payer.
     *
     * @return vide s'il n'y a rien à facturer dans ce groupe
     */
    public Optional<BillingDocument> issue(String group, LocalDate issueDate, LocalDate dueDate,
                                           DocumentNumberSequence sequence) {
        Objects.requireNonNull(issueDate, "issueDate");
        List<PendingLine> lines = pendingLines(group);
        if (lines.isEmpty()) {
            return Optional.empty();
        }
        requireIssuable();
        if (dueDate != null && dueDate.isBefore(issueDate)) {
            Money pendingTotal = lines.stream().map(PendingLine::amount).reduce(Money.ZERO, Money::plus);
            if (!pendingTotal.isNegative()) {
                throw new IllegalArgumentException("L'échéance ne peut pas précéder la date d'émission");
            }
        }

        List<DocumentLine> docLines = new ArrayList<>();
        Set<String> corrects = new LinkedHashSet<>();
        for (PendingLine line : lines) {
            docLines.add(DocumentLine.from(docLines.size() + 1, line));
            corrects.addAll(line.corrects());
        }
        Money chargesTotal = docLines.stream().map(DocumentLine::amount).reduce(Money.ZERO, Money::plus);

        if (chargesTotal.isPositive()) {
            Money room = chargesTotal;
            for (BillingDocument deposit : deposits(group)) {
                Money unpaid = openAmount(deposit.number());
                if (unpaid.isPositive()) {
                    issueDepositCreditNote(deposit, unpaid, "Annulation du solde d'acompte non réglé", issueDate,
                            sequence);
                }
                Money deduction = depositAvailableForDeduction(deposit).min(room);
                if (deduction.isPositive()) {
                    Variant v = new Variant("Déduction acompte " + deposit.number(), deduction.negate(), group,
                            ChargeKind.FEE, "deposit", Map.of());
                    docLines.add(new DocumentLine(docLines.size() + 1, DEPOSIT_KEY_PREFIX + deposit.number(), v,
                            v.label(), BigDecimal.ONE, deduction.negate(), deduction.negate(),
                            LineType.DEPOSIT_DEDUCTION, List.of(deposit.number())));
                    corrects.add(deposit.number());
                    room = room.minus(deduction);
                }
            }
        }

        Money total = docLines.stream().map(DocumentLine::amount).reduce(Money.ZERO, Money::plus);
        DocumentKind kind = total.isNegative() ? DocumentKind.CREDIT_NOTE : DocumentKind.INVOICE;
        return Optional.of(register(kind, group, issueDate, kind == DocumentKind.INVOICE ? dueDate : null, docLines,
                new ArrayList<>(corrects), sequence));
    }

    /**
     * Émet une facture d'acompte. Le montant et le moment sont décidés par l'appelant (ex. règle
     * du salon) ; la facturation se charge de la déduire ensuite.
     */
    public BillingDocument requestDeposit(String label, Money amount, String group, LocalDate issueDate,
                                          LocalDate dueDate, DocumentNumberSequence sequence) {
        if (amount == null || !amount.isPositive()) {
            throw new IllegalArgumentException("Le montant d'un acompte doit être positif");
        }
        if (dueDate != null && dueDate.isBefore(issueDate)) {
            throw new IllegalArgumentException("L'échéance ne peut pas précéder la date d'émission");
        }
        requireIssuable();
        Variant v = new Variant(label, amount, group, ChargeKind.FEE, "deposit", Map.of());
        DocumentLine line = new DocumentLine(1, "deposit", v, label, BigDecimal.ONE, amount, amount, LineType.DEPOSIT,
                List.of());
        return register(DocumentKind.DEPOSIT, group, issueDate, dueDate, List.of(line), List.of(), sequence);
    }

    /**
     * Annule tous les acomptes non encore déduits (ex. participation annulée, acompte remboursé) :
     * une note de crédit par acompte. La part non payée est soldée, la part payée devient un avoir.
     */
    public List<BillingDocument> cancelDeposits(String reason, LocalDate issueDate, DocumentNumberSequence sequence) {
        List<BillingDocument> notes = new ArrayList<>();
        for (BillingDocument deposit : documents.stream().filter(BillingDocument::isDeposit).toList()) {
            Money remaining = deposit.total().minus(deducted(deposit)).minus(depositCredited(deposit));
            if (remaining.isPositive()) {
                notes.add(issueDepositCreditNote(deposit, remaining, reason, issueDate, sequence));
            }
        }
        return notes;
    }

    private BillingDocument issueDepositCreditNote(BillingDocument deposit, Money amount, String reason,
                                                   LocalDate issueDate, DocumentNumberSequence sequence) {
        requireIssuable();
        String label = reason + " (" + deposit.number() + ")";
        Variant v = new Variant(label, amount.negate(), deposit.group(), ChargeKind.FEE, "deposit", Map.of());
        DocumentLine line = new DocumentLine(1, DEPOSIT_KEY_PREFIX + deposit.number(), v, label, BigDecimal.ONE,
                amount.negate(), amount.negate(), LineType.DEPOSIT, List.of(deposit.number()));
        return register(DocumentKind.CREDIT_NOTE, deposit.group(), issueDate, null, List.of(line),
                List.of(deposit.number()), sequence);
    }

    private BillingDocument register(DocumentKind kind, String group, LocalDate issueDate, LocalDate dueDate,
                                     List<DocumentLine> lines, List<String> corrects, DocumentNumberSequence sequence) {
        String number = sequence.next(kind, issueDate.getYear());
        BillingDocument document = new BillingDocument(number, kind, group, issueDate, dueDate, debtor, lines, corrects);
        documents.add(document);
        events.add(new BillingEvent.DocumentIssued(ref, number, kind, document.total()));
        if (document.isCreditNote()) {
            // La note de crédit règle d'abord les documents qu'elle corrige, s'ils sont encore ouverts.
            for (String corrected : document.corrects()) {
                allocate(number, corrected, issueDate);
            }
        }
        allocateAvailableCredit(issueDate);
        afterMoneyMovement();
        return document;
    }

    private void requireIssuable() {
        if (debtor == null) {
            throw new IllegalStateException("Aucun débiteur sur le dossier " + ref);
        }
        debtor.requireIssuable();
    }

    // ------------------------------------------------------------------ acomptes

    private List<BillingDocument> deposits(String group) {
        return documents.stream().filter(BillingDocument::isDeposit).filter(d -> d.group().equals(group)).toList();
    }

    /** Montant d'acompte réellement encaissé (paiements affectés), hors notes de crédit. */
    public Money depositPaid(BillingDocument deposit) {
        Set<String> paymentIds = new HashSet<>();
        payments.forEach(p -> paymentIds.add(p.id()));
        return sum(allocations, a -> a.target().equals(deposit.number()) && paymentIds.contains(a.sourceId()));
    }

    private Money deducted(BillingDocument deposit) {
        Money total = Money.ZERO;
        for (BillingDocument doc : documents) {
            for (DocumentLine line : doc.lines()) {
                if (line.type() == LineType.DEPOSIT_DEDUCTION && line.corrects().contains(deposit.number())) {
                    total = total.plus(line.amount().abs());
                }
            }
        }
        return total;
    }

    private Money depositCredited(BillingDocument deposit) {
        Money total = Money.ZERO;
        for (BillingDocument doc : documents) {
            if (doc.isCreditNote()) {
                for (DocumentLine line : doc.lines()) {
                    if (line.type() == LineType.DEPOSIT && line.corrects().contains(deposit.number())) {
                        total = total.plus(line.amount().abs());
                    }
                }
            }
        }
        return total;
    }

    /** min(encaissé, montant − annulé) − déjà déduit. */
    private Money depositAvailableForDeduction(BillingDocument deposit) {
        Money cap = depositPaid(deposit).min(deposit.total().minus(depositCredited(deposit)));
        Money available = cap.minus(deducted(deposit));
        return available.isNegative() ? Money.ZERO : available;
    }

    /** Acomptes émis dans ce dossier dont une part encaissée n'a pas encore été déduite. */
    public Money undeductedDeposits() {
        return documents.stream().filter(BillingDocument::isDeposit).map(this::depositAvailableForDeduction)
                        .reduce(Money.ZERO, Money::plus);
    }

    // ================================================================== argent

    /**
     * Enregistre un paiement. Affecté d'abord au document visé (s'il est ouvert), puis aux
     * documents ouverts les plus anciens ; le reste devient un avoir.
     *
     * @return vide si la référence bancaire a déjà été enregistrée (import en double)
     */
    public Optional<Payment> recordPayment(LocalDate date, Money amount, PaymentMode mode, String bankReference,
                                           String targetDocument) {
        Objects.requireNonNull(date, "date");
        if (amount == null || !amount.isPositive()) {
            throw new IllegalArgumentException("Un paiement doit être positif (utiliser refund() pour rembourser)");
        }
        if (bankReference != null && payments.stream().anyMatch(p -> bankReference.equals(p.bankReference()))) {
            return Optional.empty();
        }
        Payment payment = new Payment(ref + "/P" + (++paymentSeq), date, amount,
                mode == null ? PaymentMode.BANK : mode, bankReference, targetDocument);
        payments.add(payment);
        events.add(new BillingEvent.PaymentRecorded(ref, payment.id(), amount));

        if (targetDocument != null) {
            allocate(payment.id(), targetDocument, date);
        }
        allocateAvailableCredit(date);
        afterMoneyMovement();
        return Optional.of(payment);
    }

    /** Rembourse tout ou partie de l'avoir du dossier. */
    public Refund refund(LocalDate date, Money amount, String reason) {
        if (amount == null || !amount.isPositive()) {
            throw new IllegalArgumentException("Le remboursement doit être positif");
        }
        if (amount.compareTo(credit()) > 0) {
            throw new IllegalStateException("Remboursement (" + amount + ") supérieur à l'avoir (" + credit() + ")");
        }
        Refund refund = new Refund(ref + "/R" + (++refundSeq), date, amount, reason);
        refunds.add(refund);
        Money toConsume = amount;
        for (String source : creditSources()) {
            if (toConsume.isZero()) {
                break;
            }
            Money taken = remainingOf(source).min(toConsume);
            if (taken.isPositive()) {
                allocations.add(new Allocation(source, refund.id(), taken, date));
                toConsume = toConsume.minus(taken);
            }
        }
        afterMoneyMovement();
        return refund;
    }

    /** Documents dont l'échéance est dépassée ; publie DocumentOverdue une seule fois par document. */
    public List<BillingDocument> scanOverdue(LocalDate today) {
        List<BillingDocument> overdue = new ArrayList<>();
        for (BillingDocument doc : documents) {
            if (doc.isReceivable() && status(doc.number(), today) == DocumentStatus.OVERDUE) {
                overdue.add(doc);
                if (overdueAnnounced.add(doc.number())) {
                    events.add(new BillingEvent.DocumentOverdue(ref, doc.number(), doc.kind(), openAmount(doc.number())));
                }
            }
        }
        return overdue;
    }

    private void allocateAvailableCredit(LocalDate date) {
        for (String source : creditSources()) {
            for (BillingDocument receivable : openReceivablesOldestFirst()) {
                allocate(source, receivable.number(), date);
            }
        }
    }

    /** Affecte au plus « ce qui reste de la source » et « ce qui reste dû sur le document ». */
    private void allocate(String sourceId, String documentNumber, LocalDate date) {
        Optional<BillingDocument> target = document(documentNumber).filter(BillingDocument::isReceivable);
        if (target.isEmpty()) {
            return;
        }
        Money amount = remainingOf(sourceId).min(openAmount(documentNumber));
        if (amount.isPositive()) {
            allocations.add(new Allocation(sourceId, documentNumber, amount, date));
        }
    }

    /** Sources d'argent dans l'ordre chronologique : paiements et notes de crédit. */
    private List<String> creditSources() {
        record Source(String id, LocalDate date, int order) {}
        List<Source> sources = new ArrayList<>();
        int order = 0;
        for (Payment p : payments) {
            sources.add(new Source(p.id(), p.date(), order++));
        }
        for (BillingDocument d : documents) {
            if (d.isCreditNote()) {
                sources.add(new Source(d.number(), d.issueDate(), order++));
            }
        }
        sources.sort(Comparator.comparing(Source::date).thenComparing(Source::order));
        return sources.stream().map(Source::id).toList();
    }

    private Money sourceAmount(String sourceId) {
        return payments.stream().filter(p -> p.id().equals(sourceId)).map(Payment::amount).findFirst()
                       .or(() -> document(sourceId).filter(BillingDocument::isCreditNote).map(d -> d.total().abs()))
                       .orElse(Money.ZERO);
    }

    private Money remainingOf(String sourceId) {
        return sourceAmount(sourceId).minus(sum(allocations, a -> a.sourceId().equals(sourceId)));
    }

    private List<BillingDocument> openReceivablesOldestFirst() {
        return documents.stream().filter(BillingDocument::isReceivable)
                        .filter(d -> openAmount(d.number()).isPositive())
                        .sorted(Comparator.comparing(BillingDocument::issueDate).thenComparing(BillingDocument::number))
                        .toList();
    }

    private void afterMoneyMovement() {
        for (BillingDocument doc : documents) {
            if (doc.isReceivable() && openAmount(doc.number()).isZero() && settledDocuments.add(doc.number())) {
                boolean paidWithMoney = doc.total().isPositive() && sum(allocations, a -> a.target().equals(doc.number())
                        && payments.stream().anyMatch(p -> p.id().equals(a.sourceId()))).equals(doc.total());
                events.add(new BillingEvent.DocumentSettled(ref, doc.number(), doc.kind(), paidWithMoney));
            }
        }
        boolean nowSettled = isSettled();
        if (nowSettled && !settled) {
            events.add(new BillingEvent.CaseSettled(ref));
        }
        Money credit = credit();
        if (openReceivablesOldestFirst().isEmpty() && credit.isPositive() && !credit.equals(lastAnnouncedCredit)) {
            events.add(new BillingEvent.CreditAvailable(ref, credit));
        }
        lastAnnouncedCredit = credit;
        settled = nowSettled;
        checkInvariants();
    }

    // ================================================================== lecture

    public Money openAmount(String documentNumber) {
        BillingDocument doc = document(documentNumber).orElseThrow(
                () -> new IllegalArgumentException("Document inconnu : " + documentNumber));
        if (!doc.isReceivable()) {
            return Money.ZERO;
        }
        return doc.total().minus(sum(allocations, a -> a.target().equals(documentNumber)));
    }

    public DocumentStatus status(String documentNumber, LocalDate today) {
        BillingDocument doc = document(documentNumber).orElseThrow();
        if (!doc.isReceivable()) {
            throw new IllegalArgumentException("Le statut de paiement ne concerne que les documents à payer");
        }
        Money open = openAmount(documentNumber);
        if (open.isZero()) {
            return DocumentStatus.PAID;
        }
        if (doc.dueDate() != null && today.isAfter(doc.dueDate())) {
            return DocumentStatus.OVERDUE;
        }
        return open.compareTo(doc.total()) < 0 ? DocumentStatus.PARTIALLY_PAID : DocumentStatus.OPEN;
    }

    /** Avoir du débiteur : argent reçu (ou crédité) pas encore affecté ni remboursé. */
    public Money credit() {
        Money total = Money.ZERO;
        for (String source : creditSources()) {
            total = total.plus(remainingOf(source));
        }
        return total;
    }

    /** Ce que le débiteur doit encore (négatif = on lui doit de l'argent). */
    public Money balance() {
        Money open = documents.stream().filter(BillingDocument::isReceivable).map(d -> openAmount(d.number()))
                              .reduce(Money.ZERO, Money::plus);
        return open.minus(credit());
    }

    /** Même solde, calculé à la manière d'un compte : débits − crédits. */
    public Money ledgerBalance() {
        Money docs = documents.stream().map(BillingDocument::total).reduce(Money.ZERO, Money::plus);
        Money paid = payments.stream().map(Payment::amount).reduce(Money.ZERO, Money::plus);
        Money refunded = refunds.stream().map(Refund::amount).reduce(Money.ZERO, Money::plus);
        return docs.minus(paid).plus(refunded);
    }

    public boolean isSettled() {
        return !documents.isEmpty() && balance().isZero() && credit().isZero();
    }

    /** Rien à facturer, rien de dû, aucun avoir, aucun acompte en suspens. */
    public boolean isFullyClosed() {
        return pendingLines().isEmpty() && balance().isZero() && credit().isZero() && undeductedDeposits().isZero();
    }

    /** Garde-fou : ces égalités doivent tenir après chaque opération. */
    public void checkInvariants() {
        if (!balance().equals(ledgerBalance())) {
            throw new IllegalStateException("Solde incohérent : " + balance() + " ≠ " + ledgerBalance());
        }
        for (BillingDocument doc : documents) {
            if (doc.isReceivable() && openAmount(doc.number()).isNegative()) {
                throw new IllegalStateException("Document sur-affecté : " + doc.number());
            }
            if (doc.isInvoice() && doc.total().isNegative()) {
                throw new IllegalStateException("Facture négative : " + doc.number());
            }
        }
        for (String source : creditSources()) {
            if (remainingOf(source).isNegative()) {
                throw new IllegalStateException("Source sur-consommée : " + source);
            }
        }
    }

    public Optional<BillingDocument> document(String number) {
        return documents.stream().filter(d -> d.number().equals(number)).findFirst();
    }

    public Optional<BillingDocument> documentByQrReference(String qrReference) {
        String normalized = qrReference.replace(" ", "");
        return documents.stream().filter(d -> d.qrReference().equals(normalized)).findFirst();
    }

    /** Retourne et vide les événements en attente de publication. */
    public List<BillingEvent> pullEvents() {
        List<BillingEvent> copy = List.copyOf(events);
        events.clear();
        return copy;
    }

    public void changeDebtor(Debtor debtor) {
        this.debtor = debtor;
    }

    public SourceRef ref() { return ref; }
    public Debtor debtor() { return debtor; }
    public List<BillingDocument> documents() { return List.copyOf(documents); }
    public List<Payment> payments() { return List.copyOf(payments); }
    public List<Refund> refunds() { return List.copyOf(refunds); }
    public List<Allocation> allocations() { return List.copyOf(allocations); }

    private static Money sum(List<Allocation> list, Predicate<Allocation> filter) {
        return list.stream().filter(filter).map(Allocation::amount).reduce(Money.ZERO, Money::plus);
    }
}
