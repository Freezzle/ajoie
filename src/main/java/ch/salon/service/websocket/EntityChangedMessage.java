package ch.salon.service.websocket;

import ch.salon.domain.enumeration.EntityType;

import java.util.UUID;

/**
 * Message poussé aux écrans quand une entité a changé hors du cycle requête/réponse.
 * <p>
 * Il ne transporte volontairement aucune donnée métier : le client recharge l'entité par son
 * API habituelle, ce qui évite de dupliquer les règles de visibilité dans le socket.
 */
public record EntityChangedMessage(EntityType entityType, UUID entityId) {
}
