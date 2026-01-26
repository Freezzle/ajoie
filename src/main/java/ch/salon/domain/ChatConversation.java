package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "chat_conversation", indexes = {
    @Index(name = "idx_conv_users", columnList = "participant_a, participant_b", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversation extends AbstractAuditingEntity<UUID> implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "participant_a", nullable = false, length = 50)
    private String participantA;

    @NotNull
    @Column(name = "participant_b", nullable = false, length = 50)
    private String participantB;

    @Column(name = "last_message_time", nullable = true)
    private Instant lastMessageTime;
}
