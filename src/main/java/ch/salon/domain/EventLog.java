package ch.salon.domain;

import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import jakarta.persistence.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * A Invoice.
 */
@Entity
@Table(name = "event_log")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class EventLog implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getReferenceDate() {
        return referenceDate;
    }

    public void setReferenceDate(Instant referenceDate) {
        this.referenceDate = referenceDate;
    }

    public EventType getType() {
        return type;
    }

    public void setType(EventType type) {
        this.type = type;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public boolean isFromSystem() {
        return fromSystem;
    }

    public void setFromSystem(boolean fromSystem) {
        this.fromSystem = fromSystem;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(EntityType entityType) {
        this.entityType = entityType;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(UUID referenceId) {
        this.referenceId = referenceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof EventLog)) {
            return false;
        }
        return getId() != null && getId().equals(((EventLog) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "EventLog{" + "fromSystem=" + fromSystem + ", label='" + label + '\'' + ", type=" + type +
            ", referenceDate=" + referenceDate + ", id=" + id + '}';
    }
}
