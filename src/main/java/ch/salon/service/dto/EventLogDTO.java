package ch.salon.service.dto;

import ch.salon.domain.enumeration.EventType;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

public class EventLogDTO implements Serializable {

    private UUID id;
    private Instant referenceDate;
    private EventType type;
    private String label;
    private boolean fromSystem = true;

    public EventLogDTO() {
        // Empty constructor needed for Jackson.
    }

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
}
