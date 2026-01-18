package ch.salon.web;

import ch.salon.service.ChatService;
import ch.salon.service.dto.ChatConversationDTO;
import ch.salon.service.dto.ChatMessageDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatResource {

    private final ChatService chatService;

    /**
     * GET /api/chat/conversations
     * Récupère toutes les conversations de l'utilisateur courant
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationDTO>> getConversations(Principal principal) {
        List<ChatConversationDTO> conversations = chatService.getConversationsForUser(principal.getName());
        return ResponseEntity.ok(conversations);
    }

    /**
     * GET /api/chat/conversations/{otherUserId}/messages
     * Récupère l'historique des messages avec un utilisateur spécifique
     */
    @GetMapping("/conversations/{otherUserId}/messages")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(
        @PathVariable String otherUserId,
        Principal principal
    ) {
        List<ChatMessageDTO> messages = chatService.getMessageHistory(principal.getName(), otherUserId);
        return ResponseEntity.ok(messages);
    }

    /**
     * POST /api/chat/conversations
     * Crée une nouvelle conversation
     */
    @PostMapping("/conversations")
    public ResponseEntity<ChatConversationDTO> createConversation(
        @RequestBody CreateConversationRequest request,
        Principal principal
    ) {
        ChatConversationDTO conversation = chatService.createConversation(principal.getName(), request.getRecipientId());
        return ResponseEntity.ok(conversation);
    }

    /**
     * GET /api/chat/available-users
     * Récupère les utilisateurs disponibles pour une nouvelle conversation
     */
    @GetMapping("/available-users")
    public ResponseEntity<List<String>> getAvailableUsers(Principal principal) {
        List<String> users = chatService.getAvailableUsersForChat(principal.getName());
        return ResponseEntity.ok(users);
    }

    /**
     * GET /api/chat/unread-count
     * Récupère le nombre de messages non lus
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Principal principal) {
        Long unreadCount = chatService.countUnreadMessages(principal.getName());
        return ResponseEntity.ok(unreadCount);
    }

    /**
     * GET /api/chat/conversations/{otherUserId}/unread-count
     * Récupère le nombre de messages non lus pour une conversation spécifique
     */
    @GetMapping("/conversations/{otherUserId}/unread-count")
    public ResponseEntity<Long> getUnreadCountForConversation(
        @PathVariable String otherUserId,
        Principal principal
    ) {
        Long unreadCount = chatService.countUnreadMessagesFrom(principal.getName(), otherUserId);
        return ResponseEntity.ok(unreadCount);
    }

    /**
     * POST /api/chat/conversations/{otherUserId}/mark-as-read
     * Marque les messages comme lus pour une conversation
     */
    @PostMapping("/conversations/{otherUserId}/mark-as-read")
    public ResponseEntity<Void> markAsRead(
        @PathVariable String otherUserId,
        Principal principal
    ) {
        chatService.markMessagesAsRead(principal.getName(), otherUserId);
        return ResponseEntity.ok().build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateConversationRequest {
        private String recipientId;
    }
}
