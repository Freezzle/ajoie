package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_comment")
@Data
public class TaskComment implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_instance_id", nullable = false)
    private TaskInstance taskInstance;

    @NotNull
    @Column(name = "author_name", nullable = false)
    private String authorName;

    @NotNull
    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
