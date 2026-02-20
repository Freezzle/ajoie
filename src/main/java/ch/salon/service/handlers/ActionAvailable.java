package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ActionType;

import java.util.List;

public record ActionAvailable(String contextCode, ActionType type, boolean disabled, String labelKey,
                               String helpKey, String confirmationKey, List<RequiredField> requiredFields) {
}
