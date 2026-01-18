package ch.salon.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationDTO {
    private String id;
    private String participantA;
    private String participantB;
    private Instant lastMessageTime;
    private Long unreadCount;
}
