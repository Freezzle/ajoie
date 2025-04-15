package ch.salon.service.handlers.enums;

import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.EmailActionHandler;

import java.util.Map;

public enum ActionType {
    EMAIL,
    DOWNLOAD,
    BUSINESS;

    public static ActionType fromHandler(Object handler) {
        if (handler instanceof EmailActionHandler<?>) {
            return EMAIL;
        }
        if (handler instanceof DocumentActionHandler<?>) {
            return DOWNLOAD;
        }
        if (handler instanceof BusinessActionHandler<?>) {
            return BUSINESS;
        }
        throw new IllegalArgumentException("Unknown handler type: " + handler.getClass());
    }

    public SupportType supports(Object handler, Object payload, Map<String, Object> ctx) {
        return switch (this) {
            case EMAIL -> ((EmailActionHandler<Object>) handler).supports(payload, ctx);
            case DOWNLOAD -> ((DocumentActionHandler<Object>) handler).supports(payload, ctx);
            case BUSINESS -> ((BusinessActionHandler<Object>) handler).supports(payload, ctx);
        };
    }
}
