package ch.salon.domain.enumeration;

public enum EmailTemplate {
    CREATION_ACCOUNT_EMAIL("creationEmail", "email.creation.title"),
    ACTIVATION_EMAIL("activationEmail", "email.activation.title"),
    RESET_PASSWORD_EMAIL("passwordResetEmail", "email.reset.title"),
    PARTICIPATION_REGISTERED_EMAIL("participationRegisteredEmail", "email.participation.registered.title"),
    PARTICIPATION_REFUSED_EMAIL("participationRefusedEmail", "email.participation.refused.title"),
    PARTICIPATION_CANCELLED_EMAIL("participationCancelledEmail", "email.participation.cancelled.title"),
    PARTICIPATION_ACCEPTED_EMAIL("participationAcceptedEmail", "email.participation.accepted.title"),
    INVOICE_EMAIL("invoiceEmail", "email.invoice.title"),
    INVOICE_RECEIPT_EMAIL("invoiceReceiptEmail", "email.invoice.receipt.title");

    private final String templateName;
    private final String subjectKey;

    EmailTemplate(String templateName, String subjectKey) {
        this.templateName = templateName;
        this.subjectKey = subjectKey;
    }

    public String getTemplateName() {
        return templateName;
    }

    public String getSubjectKey() {
        return subjectKey;
    }
}
