package ch.salon.billing.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/**
 * Document émis : facture ou note de crédit. IMMUABLE : une fois créé, rien ne change.
 * Toute correction passe par un nouveau document (facture complémentaire ou note de crédit).
 */
public final class BillingDocument {
    private final String number;
    private final DocumentKind kind;
    private final String group;
    private final LocalDate issueDate;
    private final LocalDate dueDate;
    private final Debtor debtor;
    private final List<DocumentLine> lines;
    private final Money total;
    private final List<String> corrects;
    private final String qrReference;

    BillingDocument(String number, DocumentKind kind, String group, LocalDate issueDate, LocalDate dueDate,
                    Debtor debtor, List<DocumentLine> lines, List<String> corrects) {
        this.number = Objects.requireNonNull(number);
        this.kind = kind;
        this.group = group;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.debtor = debtor;
        this.lines = List.copyOf(lines);
        this.total = this.lines.stream().map(DocumentLine::amount).reduce(Money.ZERO, Money::plus);
        this.corrects = List.copyOf(corrects);
        this.qrReference = CreditorReference.fromDocumentNumber(number);
    }

    public String number() { return number; }
    public DocumentKind kind() { return kind; }
    public String group() { return group; }
    public LocalDate issueDate() { return issueDate; }
    public LocalDate dueDate() { return dueDate; }
    public Debtor debtor() { return debtor; }
    public List<DocumentLine> lines() { return lines; }
    public Money total() { return total; }
    /** Documents corrigés par celui-ci (lignes d'annulation ou de modification). */
    public List<String> corrects() { return corrects; }
    /** Référence créancier RF (ISO 11649) à imprimer dans le QR. */
    public String qrReference() { return qrReference; }

    public boolean isInvoice() { return kind == DocumentKind.INVOICE; }
    public boolean isDeposit() { return kind == DocumentKind.DEPOSIT; }
    /** Document qui attend un paiement : facture ou facture d'acompte. */
    public boolean isReceivable() { return kind == DocumentKind.INVOICE || kind == DocumentKind.DEPOSIT; }
    public boolean isCreditNote() { return kind == DocumentKind.CREDIT_NOTE; }

    @Override
    public String toString() {
        return number + " " + kind + " " + total;
    }
}
