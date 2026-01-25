package ch.salon.domain;

import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "event_log")
@Data
public class EventLog implements Serializable {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "reference_date")
    private Instant referenceDate = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private EventType type;

    @Column(name = "label")
    private String label;

    @Column(name = "from_system")
    private boolean fromSystem = true;

    @Enumerated(EnumType.STRING)
    @Column
    private EntityType entityType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Lob
    @Column(name = "data", columnDefinition = "text")
    private String payloadJson;
}
