package ch.salon.domain.enumeration;

public enum Type {
    STAND,
    SHARED,
    CONFERENCE,
    MEAL1,
    MEAL2,
    MEAL3,
    ELECTRICITY,
    OTHERS;

    public boolean isFromStand() {
        return STAND == this || SHARED == this || ELECTRICITY == this;
    }

    public boolean isFromParticipation() {
        return MEAL1 == this || MEAL2 == this || MEAL3 == this;
    }

    public boolean isFromConference() {
        return CONFERENCE == this;
    }
}
