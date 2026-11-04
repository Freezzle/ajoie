package ch.salon.billing.domain;

/**
 * Événements publiés par la facturation. Ils portent la {@link SourceRef} : chaque module appelant
 * (participations, sponsoring…) ne réagit qu'aux événements de son type.
 */
public sealed interface BillingEvent {
    SourceRef source();

    record DocumentIssued(SourceRef source, String number, DocumentKind kind, Money total) implements BillingEvent {}

    record PaymentRecorded(SourceRef source, String paymentId, Money amount) implements BillingEvent {}

    /**
     * Une facture ou une facture d'acompte est entièrement réglée.
     *
     * @param paid vrai si elle a été réglée par de l'argent reçu ; faux si elle a été soldée (même
     *             en partie) par une note de crédit — ex. acompte impayé annulé. Un module qui valide
     *             quelque chose « à réception du paiement » doit tester ce drapeau.
     */
    record DocumentSettled(SourceRef source, String number, DocumentKind kind, boolean paid) implements BillingEvent {}

    /** Une facture ou une facture d'acompte a dépassé son échéance sans être réglée. */
    record DocumentOverdue(SourceRef source, String number, DocumentKind kind, Money open) implements BillingEvent {}

    /** Le dossier ne doit plus rien et la facturation ne doit rien au débiteur. */
    record CaseSettled(SourceRef source) implements BillingEvent {}

    /** Il reste un avoir en faveur du débiteur (à rembourser ou à reporter). */
    record CreditAvailable(SourceRef source, Money credit) implements BillingEvent {}
}
