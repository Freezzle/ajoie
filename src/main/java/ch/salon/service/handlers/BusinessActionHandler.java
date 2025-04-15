package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;

import java.util.Map;

public interface BusinessActionHandler<T> {
    SupportType supports(T payload, Map<String, Object> context);

    void execute(T payload, Map<String, Object> context);

    ContextActionType getActionType();
}
