package ch.salon.service.handlers.enums;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public enum ContextActionType {
    INVOICE_SEND("billing", "invoice-send"),
    INVOICE_SEND_AGAIN("billing", "invoice-send-again"),
    INVOICE_REMINDER("billing", "invoice-reminder"),
    INVOICE_DOWNLOAD("billing", "invoice-download"),
    INVOICE_MARK_AS_ISSUED("billing", "invoice-marked-as-issued"),
    INVOICE_MARK_AS_PAID("billing", "invoice-marked-as-paid"),
    INVOICE_PAY_ALL_CASH("billing", "invoice-pay-all-cash"),
    INVOICE_EXTEND_EXPIRY_DATE("billing", "invoice-extend-expiry-date"),
    INVOICE_SPLIT("billing", "invoice-split"),
    INVOICE_ACTIVATE_ARRANGEMENT("billing", "invoice-activate-arrangement"),
    INVOICE_DEACTIVATE_ARRANGEMENT("billing", "invoice-deactivate-arrangement"),
    INVOICE_SWITCH_TO_EMAIL("billing", "invoice-switch-to-email"),
    INVOICE_SWITCH_TO_POSTAL("billing", "invoice-switch-to-postal"),
    INVOICE_CANCELLATION_SEND("billing", "invoice-cancellation-send"),
    INVOICE_DELETE("billing", "invoice-delete"),
    INVOICE_MARK_AS_CANCELLED("billing", "invoice-marked-as-cancelled"),
    RECEIPT_SEND("billing", "receipt-send"),
    RECEIPT_DOWNLOAD("billing", "receipt-download"),
    PARTICIPATION_MARK_AS_CANCELLED("participation", "participation-marked-as-cancelled"),
    PARTICIPATION_MARK_AS_VERIFICATION("participation", "participation-marked-as-verification"),
    PARTICIPATION_MARK_AS_ACCEPTED("participation", "participation-marked-as-accepted"),
    PARTICIPATION_ACCEPTATION_EMAIL("participation", "participation-acceptation-email"),
    PARTICIPATION_VALIDATION_EMAIL("participation", "participation-validation-email"),
    PARTICIPATION_CLOSING_EMAIL("participation", "participation-closing-email"),
    PARTICIPATION_MARK_AS_VALIDATED("participation", "participation-marked-as-validated"),
    PARTICIPATION_MARK_AS_CLOSED("participation", "participation-marked-as-closed");

    private static final List<ContextActionType> VALUES = Arrays.asList(ContextActionType.values());

    private final String repositoryActionName;
    private final String code;

    ContextActionType(String repositoryActionName, String code) {
        this.repositoryActionName = repositoryActionName;
        this.code = code;
    }

    public String code() {
        return code;
    }

    public String repositoryName() {
        return repositoryActionName;
    }

    public static Optional<ContextActionType> fromCode(String code) {
        return VALUES.stream().filter(c -> c.code.equals(code)).findFirst();
    }

    /**
     * Retourne la priorité de l'action pour le tri.
     * Plus le nombre est petit, plus l'action est prioritaire dans l'affichage.
     *
     * Logique de priorité par catégorie:
     * - Actions de progression (10-19): Faire avancer le workflow (vérifier, accepter, valider, clôturer)
     * - Actions de paiement (20-29): Payer, marquer comme payé/émis
     * - Actions d'extension (30-39): Prolonger des dates, modifier
     * - Emails principaux (40-49): Emails de notification liés au workflow
     * - Emails secondaires (50-59): Rappels, renvois
     * - Téléchargements (60-69): Consulter des documents
     * - Actions d'annulation (90-94): Annuler des entités
     * - Actions destructives (95-99): Supprimer définitivement
     */
    public int getPriority() {
        return switch (this) {
            // === PARTICIPATION - Actions de progression du workflow ===
            case PARTICIPATION_MARK_AS_VERIFICATION -> 10;  // Mettre en vérification (début du processus)
            case PARTICIPATION_MARK_AS_ACCEPTED -> 11;       // Accepter la participation
            case PARTICIPATION_MARK_AS_VALIDATED -> 12;      // Valider la participation
            case PARTICIPATION_MARK_AS_CLOSED -> 13;         // Clôturer la participation (fin du processus)

            // === BILLING - Actions de progression et paiement ===
            case INVOICE_MARK_AS_ISSUED -> 14;               // Marquer facture comme émise
            case INVOICE_MARK_AS_PAID -> 15;                 // Marquer facture comme payée (manuel)
            case INVOICE_PAY_ALL_CASH -> 20;                 // Payer comptant (action importante)

            // === BILLING - Actions d'extension/modification ===
            case INVOICE_EXTEND_EXPIRY_DATE -> 30;           // Prolonger la date d'expiration
            case INVOICE_SPLIT -> 31;                        // Fractionner la facture
            case INVOICE_ACTIVATE_ARRANGEMENT -> 32;         // Activer l'arrangement de paiement
            case INVOICE_DEACTIVATE_ARRANGEMENT -> 33;       // Désactiver l'arrangement de paiement
            case INVOICE_SWITCH_TO_EMAIL -> 34;              // Changer pour envoyer par email
            case INVOICE_SWITCH_TO_POSTAL -> 35;             // Changer pour envoyer par la poste

            // === PARTICIPATION - Emails principaux liés au workflow ===
            case PARTICIPATION_ACCEPTATION_EMAIL -> 40;      // Email d'acceptation
            case PARTICIPATION_VALIDATION_EMAIL -> 41;       // Email de validation
            case PARTICIPATION_CLOSING_EMAIL -> 42;          // Email de clôture

            // === BILLING - Emails principaux ===
            case INVOICE_SEND -> 43;                         // Envoyer la facture (première fois)
            case RECEIPT_SEND -> 44;                         // Envoyer le reçu

            // === BILLING - Emails secondaires (rappels) ===
            case INVOICE_SEND_AGAIN -> 50;                   // Renvoyer la facture
            case INVOICE_REMINDER -> 51;                     // Rappel de paiement
            case INVOICE_CANCELLATION_SEND -> 52;            // Email d'annulation de facture

            // === BILLING - Téléchargements (consultation) ===
            case INVOICE_DOWNLOAD -> 60;                     // Télécharger la facture
            case RECEIPT_DOWNLOAD -> 61;                     // Télécharger le reçu

            // === Actions d'annulation (destructives mais réversibles) ===
            case PARTICIPATION_MARK_AS_CANCELLED -> 90;      // Annuler la participation
            case INVOICE_MARK_AS_CANCELLED -> 91;            // Annuler la facture

            // === Actions destructives (irréversibles - toujours à la fin) ===
            case INVOICE_DELETE -> 95;                       // Supprimer la facture
        };
    }
}
