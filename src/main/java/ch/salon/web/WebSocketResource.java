package ch.salon.web;

import ch.salon.service.ChatService;
import ch.salon.service.PresenceService;
import ch.salon.service.dto.ChatMessageDTO;
import ch.salon.service.websocket.WebSocketContextManager;
import ch.salon.service.websocket.WebSocketEventBus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Arrays;

/**
 * Consolidated WebSocket handler for all real-time operations.
 * Combines chat, presence (ping), and event handling in a single controller.
 */
@Slf4j
@Controller
public class WebSocketResource extends BaseWebSocketResource {

    private final ChatService chatService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messaging;

    public WebSocketResource(
            ChatService chatService,
            PresenceService presenceService,
            SimpMessagingTemplate messaging,
            WebSocketContextManager contextManager,
            WebSocketEventBus eventBus) {
        super(contextManager, eventBus);
        this.chatService = chatService;
        this.presenceService = presenceService;
        this.messaging = messaging;
    }

    // ==================== CHAT HANDLERS ====================

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        contextManager.withUserContext(principal, (senderId, tenantId, userId) -> {
            if (!validateChatRequest(request, senderId)) {
                return null;
            }

            try {
                ChatMessageDTO savedMsg = chatService.saveMessage(senderId, request.getRecipientId(), request.getContent());
                broadcastChatMessage(senderId, request.getRecipientId(), savedMsg);
                eventBus.publishMessageSent(senderId, request.getRecipientId(), tenantId);
                log.debug("Chat message sent: {} -> {}", senderId, request.getRecipientId());
            } catch (Exception e) {
                log.error("Error saving chat message", e);
            }
            return null;
        });
    }

    // ==================== PRESENCE HANDLERS ====================

    @MessageMapping("/presence/ping")
    public void pingPresence(Principal principal) {
        contextManager.withUserContext(principal, (login, tenantId, userId) -> {
            presenceService.heartbeat(login);
            log.debug("Presence ping from: {}", login);
            return null;
        });
    }

    // ==================== HELPERS ====================

    private boolean validateChatRequest(ChatMessageRequest request, String senderId) {
        if (request.getRecipientId() == null || request.getRecipientId().isBlank()) {
            log.warn("Invalid chat request: missing recipientId from {}", senderId);
            return false;
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            log.warn("Invalid chat request: empty content from {}", senderId);
            return false;
        }
        return true;
    }

    private void broadcastChatMessage(String senderId, String recipientId, ChatMessageDTO savedMsg) {
        String conversationKey = getConversationKey(senderId, recipientId);

        messaging.convertAndSendToUser(senderId, "/queue/chat/" + conversationKey, savedMsg);
        messaging.convertAndSendToUser(recipientId, "/queue/chat/" + conversationKey, savedMsg);
        messaging.convertAndSendToUser(recipientId, "/queue/messages", savedMsg);
    }

    private String getConversationKey(String user1, String user2) {
        String[] users = {user1, user2};
        Arrays.sort(users);
        return users[0] + "_" + users[1];
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageRequest {
        private String recipientId;
        private String content;
    }
}

