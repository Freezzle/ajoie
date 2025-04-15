package ch.salon.domain.enumeration;

/**
 * The Status enumeration.
 */
public enum Status {
    REFUSED,
    CANCELED,
    IN_VERIFICATION,
    ACCEPTED,
    VALIDATED,
    CLOSED;

    public boolean isInvalidStatus() {
        return REFUSED == this || CANCELED == this || CLOSED == this;
    }
}
