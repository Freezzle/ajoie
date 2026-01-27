package ch.salon.service.websocket;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WebSocketEventBus {

    private final ApplicationEventPublisher eventPublisher;

    public WebSocketEventBus(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void publishUserConnected(String login, String sessionId, UUID tenantId) {
        eventPublisher.publishEvent(new WebSocketUserConnectedEvent(login, sessionId, tenantId));
    }

    public void publishUserDisconnected(String sessionId) {
        eventPublisher.publishEvent(new WebSocketUserDisconnectedEvent(sessionId));
    }

    public void publishMessageSent(String senderId, String recipientId, UUID tenantId) {
        eventPublisher.publishEvent(new WebSocketMessageSentEvent(senderId, recipientId, tenantId));
    }

    public static class WebSocketUserConnectedEvent extends org.springframework.context.ApplicationEvent {
        private final String login;
        private final String sessionId;
        private final UUID tenantId;

        public WebSocketUserConnectedEvent(String login, String sessionId, UUID tenantId) {
            super(login);
            this.login = login;
            this.sessionId = sessionId;
            this.tenantId = tenantId;
        }

        public String getLogin() {
            return login;
        }

        public String getSessionId() {
            return sessionId;
        }

        public UUID getTenantId() {
            return tenantId;
        }
    }

    public static class WebSocketUserDisconnectedEvent extends org.springframework.context.ApplicationEvent {
        private final String sessionId;

        public WebSocketUserDisconnectedEvent(String sessionId) {
            super(sessionId);
            this.sessionId = sessionId;
        }

        public String getSessionId() {
            return sessionId;
        }
    }

    public static class WebSocketMessageSentEvent extends org.springframework.context.ApplicationEvent {
        private final String senderId;
        private final String recipientId;
        private final UUID tenantId;

        public WebSocketMessageSentEvent(String senderId, String recipientId, UUID tenantId) {
            super(senderId);
            this.senderId = senderId;
            this.recipientId = recipientId;
            this.tenantId = tenantId;
        }

        public String getSenderId() {
            return senderId;
        }

        public String getRecipientId() {
            return recipientId;
        }

        public UUID getTenantId() {
            return tenantId;
        }
    }
}
