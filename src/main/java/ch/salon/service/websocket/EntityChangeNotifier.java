package ch.salon.service.websocket;

import ch.salon.domain.enumeration.EntityType;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Prévient les écrans ouverts qu'une entité vient d'être modifiée par un traitement
 * asynchrone (envoi d'email notamment), que la requête HTTP d'origine a déjà rendu la main.
 * <p>
 * Le canal est découpé par salon : le front connaît déjà l'identifiant du salon affiché, et
 * un salon appartient à un seul locataire, donc l'isolation est conservée sans exposer le
 * {@code tenantId} au navigateur.
 */
@Component
@RequiredArgsConstructor
public class EntityChangeNotifier {
    private static final Logger LOGGER = LoggerFactory.getLogger(EntityChangeNotifier.class);

    private final SimpMessagingTemplate messaging;

    /** Une notification ne doit jamais faire échouer le traitement qui l'a déclenchée. */
    public void notifyChanged(EntityType entityType, UUID entityId, UUID idSalon) {
        if (entityId == null || idSalon == null) {
            return;
        }

        try {
            messaging.convertAndSend("/topic/salon/" + idSalon + "/entity-changed",
                    new EntityChangedMessage(entityType, entityId));
        } catch (Exception e) {
            LOGGER.warn("Impossible de notifier le changement de {} {}", entityType, entityId, e);
        }
    }
}
