package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "chat_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage extends AbstractAuditingEntity<UUID> implements Serializable {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(nullable = false, length = 50)
    private String senderId;

    @NotNull
    @Column(nullable = false, length = 50)
    private String recipientId;

    @NotNull
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @NotNull
    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private Boolean isRead = false;
}
