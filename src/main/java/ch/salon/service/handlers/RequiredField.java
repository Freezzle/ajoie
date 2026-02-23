package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.FieldType;

import java.util.List;
import java.util.Map;

public record RequiredField(String name, FieldType type, String labelKey, List<Map<String, String>> options) {

    // Constructeur sans options pour compatibilité avec les champs existants
    public RequiredField(String name, FieldType type, String labelKey) {
        this(name, type, labelKey, null);
    }
}
