package ch.salon.domain.enumeration;

import java.util.Arrays;

/**
 * The Status enumeration.
 */
public enum Status {
    REFUSED, CANCELED, IN_VERIFICATION, ACCEPTED, VALIDATED, CLOSED;

    public boolean isActiveStatus() {
        return this != CANCELED && this != REFUSED;
    }

    public static Status[] getActiveStatuses() {
        return Arrays.stream(Status.values()).filter(Status::isActiveStatus).toArray(Status[]::new);
    }
}
