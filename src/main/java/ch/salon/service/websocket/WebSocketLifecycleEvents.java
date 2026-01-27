package ch.salon.service.websocket;

import ch.salon.service.PresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Consolidated WebSocket lifecycle events.
 * Handles connection, disconnection, and presence initialization.
 */
@Component
public class WebSocketLifecycleEvents {

    private final PresenceService presenceService;
    private final WebSocketContextManager contextManager;
    private final WebSocketEventBus eventBus;

    public WebSocketLifecycleEvents(
            PresenceService presenceService,
            WebSocketContextManager contextManager,
            WebSocketEventBus eventBus) {
        this.presenceService = presenceService;
        this.contextManager = contextManager;
        this.eventBus = eventBus;
    }

    @EventListener
    public void onConnect(SessionConnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        if (sha.getUser() == null) return;

        String login = sha.getUser().getName();
        String sessionId = sha.getSessionId();

        contextManager.withUserContext(sha.getUser(), (lgin, tenantId, userId) -> {
            presenceService.connect(login, sessionId);
            eventBus.publishUserConnected(login, sessionId, tenantId);
            return null;
        });
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presenceService.disconnect(event.getSessionId());
        eventBus.publishUserDisconnected(event.getSessionId());
    }
}
