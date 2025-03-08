package ch.salon.domain.enumeration;

/**
 * The Status enumeration.
 */
public enum State {
    DRAFT,
    ISOLATED,
    ISSUED,
    PAID,
    CANCELLED;

    public boolean isDraft() {
        return this == DRAFT || this == ISOLATED;
    }

    public boolean isNotDraft() {
        return !isDraft();
    }
}
