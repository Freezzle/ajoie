package ch.salon.web;

import ch.salon.service.ChatService;
import ch.salon.service.dto.ChatMessageDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebsocketResource {

    private final ChatService chatService;
    private final SimpMessagingTemplate messaging;
    private final org.springframework.messaging.simp.user.SimpUserRegistry userRegistry;

    /**
     * Reçoit un message depuis /app/chat.send et l'envoie au destinataire
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        System.out.println("🔵 WebSocket: Message reçu sur /app/chat.send");
        System.out.println("   Principal: " + (principal != null ? principal.getName() : "NULL"));
        System.out.println("   Request: " + request);

        if (principal == null) {
            System.out.println("❌ Principal est NULL, abandon");
            return;
        }

        String senderId = principal.getName();
        System.out.println("   SenderId: " + senderId);

        // Validation basique
        if (request.getRecipientId() == null || request.getRecipientId().isBlank() ||
                request.getContent() == null || request.getContent().isBlank()) {
            System.out.println("❌ Validation échouée");
            return;
        }

        System.out.println("   RecipientId: " + request.getRecipientId());
        System.out.println("   Content: " + request.getContent());

        // Sauvegarder le message
        ChatMessageDTO savedMsg = chatService.saveMessage(senderId, request.getRecipientId(), request.getContent());
        System.out.println("✅ Message sauvegardé: " + savedMsg.getId());

        // Créer une clé unique et déterministe pour cette conversation
        String conversationKey = getConversationKey(senderId, request.getRecipientId());
        System.out.println("📤 Envoi du message à la conversation: " + conversationKey);

        try {
            // Envoyer à l'expéditeur
            System.out.println("   → Envoi à sender: " + senderId);
            messaging.convertAndSendToUser(
                    senderId,
                    "/queue/chat/" + conversationKey,
                    savedMsg
            );

            // Envoyer au destinataire
            System.out.println("   → Envoi à recipient: " + request.getRecipientId());
            messaging.convertAndSendToUser(
                    request.getRecipientId(),
                    "/queue/chat/" + conversationKey,
                    savedMsg
            );

            // Broadcast à /user/queue/messages pour que la liste des conversations se rafraîchisse
            System.out.println("   📤 Broadcast à /user/queue/messages pour le destinataire");
            messaging.convertAndSendToUser(
                    request.getRecipientId(),
                    "/queue/messages",
                    savedMsg
            );

            System.out.println("✅ Message envoyé aux 2 participants");

        } catch (Exception e) {
            System.out.println("❌ ERREUR lors de l'envoi: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Crée une clé unique et déterministe pour une conversation
     * Exemple: admin_dylan ou dylan_admin (toujours dans le même ordre)
     */
    private String getConversationKey(String user1, String user2) {
        String[] users = {user1, user2};
        java.util.Arrays.sort(users);
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
