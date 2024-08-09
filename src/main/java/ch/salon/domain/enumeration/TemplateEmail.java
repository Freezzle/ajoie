package ch.salon.domain.enumeration;

public enum TemplateEmail {
    CREATION_ACCOUNT_EMAIL("mail/creationEmail", "email.creation.title"),
    ACTIVATION_EMAIL("mail/activationEmail", "email.activation.title"),
    RESET_PASSWORD_EMAIL("mail/passwordResetEmail", "email.reset.title"),
    PARTICIPATION_REGISTERED_EMAIL("mail/participationRegisteredEmail", "email.participation.registered.title"),
    PARTICIPATION_REFUSED_EMAIL("mail/participationRefusedEmail", "email.participation.refused.title"),
    PARTICIPATION_CANCELLED_EMAIL("mail/participationCancelledEmail", "email.participation.cancelled.title"),
    PARTICIPATION_ACCEPTED_EMAIL("mail/participationAcceptedEmail", "email.participation.accepted.title"),
    INVOICE_EMAIL("mail/invoiceEmail", "email.invoice.title"),
    INVOICE_RECEIPT_EMAIL("mail/invoiceReceiptEmail", "email.invoice.receipt.title");

    private final String templateName;
    private final String subjectKey;

    TemplateEmail(String templateName, String subjectKey) {
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
