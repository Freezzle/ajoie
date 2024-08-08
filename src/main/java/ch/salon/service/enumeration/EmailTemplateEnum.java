package ch.salon.service.enumeration;

public enum EmailTemplateEnum {
    CREATION_ACCOUNT_EMAIL("mail/creationEmail", "email.creation.title"),
    ACTIVATION_EMAIL("mail/activationEmail", "email.activation.title"),
    REST_PASSWORD_EMAIL("mail/passwordResetEmail", "email.reset.title"),
    INVOICE_EMAIL("mail/invoiceEmail", "email.invoice.title"),
    RECEIPT_INVOICE_EMAIL("mail/receiptInvoiceEmail", "email.receiptinvoice.title");

    private final String templateName;
    private final String subjectKey;

    EmailTemplateEnum(String templateName, String subjectKey) {
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
