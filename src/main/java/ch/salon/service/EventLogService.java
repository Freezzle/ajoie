package ch.salon.service;

import ch.salon.domain.EventLog;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.EventLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import tools.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(value = Transactional.TxType.REQUIRED)
@AllArgsConstructor
public class EventLogService {
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final EventLogRepository eventLogRepository;

    public void eventFromSystem(String label, EventType eventType, EntityType entityType, UUID referenceId,
            Map<String, String> extraAttributes) {
        this.eventLogRepository.save(
                instance(label, eventType, entityType, referenceId, Instant.now(), extraAttributes, true));
    }

    public void eventFromUser(String label, EventType eventType, EntityType entityType, UUID referenceId,
            Instant referenceDate, Map<String, String> extraAttributes) {
        this.eventLogRepository.save(
                instance(label, eventType, entityType, referenceId, referenceDate, extraAttributes, false));
    }

    public List<EventLog> findAllEventLog(EntityType entityType, UUID referenceId) {
        return this.eventLogRepository.findAllByEntityTypeAndReferenceIdOrderByReferenceDateAsc(entityType,
                referenceId);
    }

    private EventLog instance(String label, EventType eventType, EntityType entityType, UUID referenceId,
            Instant referenceDate, Map<String, String> extraAttributes, boolean fromSystem) {
        EventLog eventLog = new EventLog();
        eventLog.setLabel(label);
        eventLog.setType(eventType);
        eventLog.setEntityType(entityType);
        eventLog.setReferenceId(referenceId);
        eventLog.setReferenceDate(referenceDate);
        eventLog.setFromSystem(fromSystem);

        if (extraAttributes != null && !extraAttributes.isEmpty()) {
            eventLog.setPayloadJson(objectMapper.writeValueAsString(extraAttributes));
        }

        return eventLog;
    }
}
