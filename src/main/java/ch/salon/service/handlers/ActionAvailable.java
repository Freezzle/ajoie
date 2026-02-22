package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ActionType;
import ch.salon.service.handlers.enums.ContextActionType;

import java.util.List;

public record ActionAvailable(String contextCode, ActionType type, boolean disabled, String labelKey,
                               String helpKey, String confirmationKey, List<RequiredField> requiredFields,
                               String disabledReasonKey) {

    /**
     * Retourne la clé de tri pour ordonner les actions.
     * Combine la priorité du type (BUSINESS/EMAIL/DOWNLOAD) avec la priorité spécifique de chaque action.
     *
     * Exemple:
     * - PARTICIPATION_MARK_AS_ACCEPTED (BUSINESS): 100 + 11 = 111
     * - PARTICIPATION_ACCEPTATION_EMAIL (EMAIL): 200 + 40 = 240
     * - INVOICE_DOWNLOAD (DOWNLOAD): 300 + 60 = 360
     * - INVOICE_DELETE (BUSINESS): 100 + 95 = 195
     */
    public int getSortingKey() {
        return type.getTypePriority() +
               ContextActionType.fromCode(contextCode)
                   .map(ContextActionType::getPriority)
                   .orElse(999); // Actions sans priorité définie vont à la fin
    }
}
