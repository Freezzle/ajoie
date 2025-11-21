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
    INVOICE_EXTEND_EXPIRY_DATE("billing", "invoice-extend-expiry-date"),
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
}
