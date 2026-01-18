package ch.salon.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private String id;
    private String senderId;
    private String recipientId;
    private String content;
    private Instant timestamp;
    private Boolean isRead;
}
