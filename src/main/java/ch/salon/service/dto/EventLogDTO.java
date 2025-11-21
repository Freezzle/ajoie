package ch.salon.service.dto;

import ch.salon.domain.enumeration.EventType;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
public class EventLogDTO implements Serializable {

    private UUID id;
    private Instant referenceDate;
    private EventType type;
    private String label;
    private Map<String, String> extraAttributes = new HashMap<>();
    private boolean fromSystem = true;
}
