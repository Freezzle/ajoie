package ch.salon.service;

import ch.salon.domain.enumeration.Type;

import java.util.UUID;

public record InvoiceKey(Type type, UUID referenceId) {
}
