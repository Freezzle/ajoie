package ch.salon.repository;

import ch.salon.domain.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.senderId = :userId AND m.recipientId = :otherUserId)
           OR (m.senderId = :otherUserId AND m.recipientId = :userId)
        ORDER BY m.timestamp DESC
    """)
    Page<ChatMessage> findConversationMessages(
        @Param("userId") String userId,
        @Param("otherUserId") String otherUserId,
        Pageable pageable
    );

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.senderId = :userId AND m.recipientId = :otherUserId)
           OR (m.senderId = :otherUserId AND m.recipientId = :userId)
        ORDER BY m.timestamp ASC
    """)
    List<ChatMessage> findConversationMessagesAsc(
        @Param("userId") String userId,
        @Param("otherUserId") String otherUserId
    );

    /**
     * Compte le nombre de messages non lus pour un utilisateur
     */
    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.recipientId = :userId AND m.isRead = false
    """)
    Long countUnreadMessages(@Param("userId") String userId);

    /**
     * Compte les messages non lus reçus d'un utilisateur spécifique
     */
    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.recipientId = :userId AND m.senderId = :senderId AND m.isRead = false
    """)
    Long countUnreadMessagesFrom(@Param("userId") String userId, @Param("senderId") String senderId);

    /**
     * Marque tous les messages reçus d'un expéditeur comme lus pour un utilisateur
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true
        WHERE m.recipientId = :userId AND m.senderId = :senderId AND m.isRead = false
    """)
    void markAsRead(@Param("userId") String userId, @Param("senderId") String senderId);
}
