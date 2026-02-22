package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ContextActionType;

import java.util.Map;

public interface EmailActionHandler<T> {
    ActionSupport supports(T payload, Map<String, Object> context);

    EmailMessage buildTemplate(T payload, Map<String, Object> context);

    void handle(T payload, Map<String, Object> context) throws Exception;

    ContextActionType getActionType();
}
