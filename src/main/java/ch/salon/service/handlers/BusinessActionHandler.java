package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ContextActionType;

import java.util.Map;

public interface BusinessActionHandler<T> {
    ActionSupport supports(T payload, Map<String, Object> context);

    void execute(T payload, Map<String, Object> context);

    ContextActionType getActionType();
}
