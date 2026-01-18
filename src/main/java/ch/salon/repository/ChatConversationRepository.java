package ch.salon.repository;

import ch.salon.domain.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    @Query("""
        SELECT c FROM ChatConversation c
        WHERE (c.participantA = :login AND c.participantB = :otherLogin)
           OR (c.participantA = :otherLogin AND c.participantB = :login)
    """)
    Optional<ChatConversation> findBetween(
        @Param("login") String login,
        @Param("otherLogin") String otherLogin
    );

    @Query("""
        SELECT c FROM ChatConversation c
        WHERE c.participantA = :login OR c.participantB = :login
        ORDER BY c.lastMessageTime DESC NULLS LAST
    """)
    List<ChatConversation> findAllForUser(@Param("login") String login);
}
