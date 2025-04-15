package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ActionType;

public record ActionAvailable(String contextCode, ActionType type, boolean disabled, String labelKey) {}
