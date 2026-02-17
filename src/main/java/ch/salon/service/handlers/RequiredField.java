package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.FieldType;

public record RequiredField(String name, FieldType type, String labelKey) {
}
