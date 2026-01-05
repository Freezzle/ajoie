package ch.salon.service.websocket;

import ch.salon.service.PresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class PresenceWebsocketEvents {

    private final PresenceService presence;

    public PresenceWebsocketEvents(PresenceService presence) {
        this.presence = presence;
    }

    @EventListener
    public void onConnect(SessionConnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        if (sha.getUser() == null) return;

        String login = sha.getUser().getName();
        presence.connect(login, sha.getSessionId());
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        presence.disconnect(event.getSessionId());
    }
}
