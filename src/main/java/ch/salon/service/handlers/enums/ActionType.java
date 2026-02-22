package ch.salon.service.handlers.enums;

import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.EmailActionHandler;

import java.util.Map;

public enum ActionType {
    EMAIL, DOWNLOAD, BUSINESS;

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

    /**
     * Retourne la priorité de base du type d'action.
     * Les BusinessActions sont prioritaires (100), puis les EmailActions (200), puis les DownloadActions (300).
     * Cette priorité est combinée avec la priorité spécifique de ContextActionType pour le tri final.
     */
    public int getTypePriority() {
        return switch (this) {
            case BUSINESS -> 100;
            case EMAIL -> 200;
            case DOWNLOAD -> 300;
        };
    }
}
