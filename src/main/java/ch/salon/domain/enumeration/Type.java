package ch.salon.domain.enumeration;

public enum Type {
    STAND, SHARED, CONFERENCE, WORKSHOP, MEAL1, MEAL2, MEAL3, ELECTRICITY, POSTAL_FEE, OTHERS;

    public boolean isFromStand() {
        return STAND == this || SHARED == this || ELECTRICITY == this;
    }

    public boolean isFromParticipation() {
        return MEAL1 == this || MEAL2 == this || MEAL3 == this;
    }

    public boolean isFromConference() {
        return CONFERENCE == this;
    }

    public boolean isFromWorkshop() {
        return WORKSHOP == this;
    }
}
