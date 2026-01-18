package ch.salon.service;

import ch.salon.domain.ChatConversation;
import ch.salon.domain.ChatMessage;
import ch.salon.repository.ChatConversationRepository;
import ch.salon.repository.ChatMessageRepository;
import ch.salon.repository.UserRepository;
import ch.salon.service.dto.ChatConversationDTO;
import ch.salon.service.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private static final int PAGE_SIZE = 50;

    private final ChatMessageRepository messageRepository;
    private final ChatConversationRepository conversationRepository;
    private final UserRepository userRepository;

    /**
     * Sauvegarde un message et met à jour lastMessageTime de la conversation
     */
    public ChatMessageDTO saveMessage(String senderId, String recipientId, String content) {
        // Créer/récupérer la conversation
        ChatConversation conv = conversationRepository.findBetween(senderId, recipientId)
                .orElseGet(() -> {
                    ChatConversation newConv = new ChatConversation();
                    newConv.setParticipantA(senderId);
                    newConv.setParticipantB(recipientId);
                    return newConv;
                });

        conv.setLastMessageTime(Instant.now());
        conversationRepository.save(conv);

        // Créer le message
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setRecipientId(recipientId);
        msg.setContent(content);
        msg.setTimestamp(Instant.now());
        msg.setIsRead(false);

        ChatMessage saved = messageRepository.save(msg);
        return mapToDTO(saved);
    }

    /**
     * Récupère les conversations d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<ChatConversationDTO> getConversationsForUser(String login) {
        List<ChatConversation> conversations = conversationRepository.findAllForUser(login);
        return conversations.stream()
                .map(conv -> mapConversationToDTO(conv, login))
                .toList();
    }

    /**
     * Récupère les messages entre deux utilisateurs (paginé, plus récents en premier)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getMessageHistory(String userId, String otherUserId) {
        // Récupérer les 50 derniers messages
        Pageable pageable = PageRequest.of(0, PAGE_SIZE);
        Page<ChatMessage> page = messageRepository.findConversationMessages(userId, otherUserId, pageable);

        // Les retourner en ordre croissant (plus ancien d'abord)
        return page.getContent().stream()
                .sorted((m1, m2) -> m1.getTimestamp().compareTo(m2.getTimestamp()))
                .map(this::mapToDTO)
                .toList();
    }

    /**
     * Crée une nouvelle conversation explicitement
     */
    public ChatConversationDTO createConversation(String initiatorLogin, String otherLogin) {
        // Vérifier que l'autre utilisateur existe
        if (!userRepository.findOneByLogin(otherLogin).isPresent()) {
            throw new IllegalArgumentException("Utilisateur " + otherLogin + " introuvable");
        }

        ChatConversation existing = conversationRepository.findBetween(initiatorLogin, otherLogin)
                .orElse(null);

        if (existing != null) {
            return mapConversationToDTO(existing, initiatorLogin);
        }

        ChatConversation conv = new ChatConversation();
        conv.setParticipantA(initiatorLogin);
        conv.setParticipantB(otherLogin);

        return mapConversationToDTO(conversationRepository.save(conv), initiatorLogin);
    }

    /**
     * Récupère tous les utilisateurs SAUF ceux déjà en conversation avec l'utilisateur courant
     */
    @Transactional(readOnly = true)
    public List<String> getAvailableUsersForChat(String currentLogin) {
        List<ChatConversation> conversations = conversationRepository.findAllForUser(currentLogin);

        // Extraire les logins des participants (autre que currentLogin)
        var conversedLogins = conversations.stream()
                .map(c -> currentLogin.equals(c.getParticipantA()) ? c.getParticipantB() : c.getParticipantA())
                .toList();

        // Récupérer tous les utilisateurs et filtrer
        return userRepository.findAll().stream()
                .map(u -> u.getLogin())
                .filter(login -> !login.equals(currentLogin) && !conversedLogins.contains(login))
                .toList();
    }

    /**
     * Compte le nombre de messages non lus pour l'utilisateur courant
     */
    @Transactional(readOnly = true)
    public Long countUnreadMessages(String userId) {
        return messageRepository.countUnreadMessages(userId);
    }

    /**
     * Compte les messages non lus reçus d'un utilisateur spécifique
     */
    @Transactional(readOnly = true)
    public Long countUnreadMessagesFrom(String userId, String senderId) {
        return messageRepository.countUnreadMessagesFrom(userId, senderId);
    }

    /**
     * Marque tous les messages reçus d'un utilisateur comme lus
     */
    public void markMessagesAsRead(String userId, String senderId) {
        messageRepository.markAsRead(userId, senderId);
    }

    // Mappers
    private ChatMessageDTO mapToDTO(ChatMessage msg) {
        return new ChatMessageDTO(
                msg.getId().toString(),
                msg.getSenderId(),
                msg.getRecipientId(),
                msg.getContent(),
                msg.getTimestamp(),
                msg.getIsRead()
        );
    }

    private ChatConversationDTO mapConversationToDTO(ChatConversation conv, String currentUserId) {
        // Déterminer qui est l'autre participant
        String otherUserId = currentUserId.equals(conv.getParticipantA())
            ? conv.getParticipantB()
            : conv.getParticipantA();

        // Compter les messages non lus reçus de l'autre participant
        Long unreadCount = countUnreadMessagesFrom(currentUserId, otherUserId);

        return new ChatConversationDTO(
                conv.getId().toString(),
                conv.getParticipantA(),
                conv.getParticipantB(),
                conv.getLastMessageTime(),
                unreadCount
        );
    }
}
