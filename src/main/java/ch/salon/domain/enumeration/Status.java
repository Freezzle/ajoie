package ch.salon.domain.enumeration;

/**
 * The Status enumeration.
 */
public enum Status {
    REFUSED,
    CANCELED,
    IN_VERIFICATION,
    ACCEPTED;

    public boolean isInvalidStatus() {
        return REFUSED == this || CANCELED == this;
    }
}
