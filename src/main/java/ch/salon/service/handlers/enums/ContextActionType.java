package ch.salon.service.handlers.enums;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public enum ContextActionType {
    INVOICE_SEND("billing", "invoice-send"),
    RECEIPT_SEND("billing", "receipt-send"),
    INVOICE_DOWNLOAD("billing", "invoice-download"),
    RECEIPT_DOWNLOAD("billing", "receipt-download"),
    INVOICE_MARK_AS_ISSUED("billing", "invoice-marked-as-issued"),
    INVOICE_MARK_AS_PAID("billing", "invoice-marked-as-paid"),
    INVOICE_CANCELLATION_SEND("billing", "invoice-cancellation-send"),
    INVOICE_DELETE("billing", "invoice-delete"),
    INVOICE_MARK_AS_CANCELLED("billing", "invoice-marked-as-cancelled"),
    PARTICIPATION_VALIDATION_SEND("participation", "participation-validation-send"),
    PARTICIPATION_MARK_AS_CANCELLED("participation", "participation-marked-as-cancelled"),
    PARTICIPATION_MARK_AS_VERIFICATION("participation", "participation-marked-as-verification"),
    PARTICIPATION_MARK_AS_ACCEPTED("participation", "participation-marked-as-accepted"),
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
