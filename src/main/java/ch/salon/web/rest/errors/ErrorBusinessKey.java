package ch.salon.web.rest.errors;

public enum ErrorBusinessKey {
    OBJ_NULL("object.null"), ID_NULL("id.null"), ID_INVALID("id.invalid"), ID_EXISTS("id.exists"), ENTITY_NOTFOUND(
            "entity.not-found"), PARTICIPATION_LINK_NULL("participation.link.null"), PARTICIPATION_NOTFOUND(
            "participation.not-found");

    private final String messageKey;

    ErrorBusinessKey(String messageKey) {
        this.messageKey = messageKey;
    }

    public String getMessageKey() {
        return messageKey;
    }
}
