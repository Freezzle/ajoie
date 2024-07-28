package ch.salon.service;

import ch.salon.domain.EventLog;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.EventLogRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Transactional(value = Transactional.TxType.REQUIRES_NEW)
public class EventLogService {

    private final EventLogRepository eventLogRepository;

    public EventLogService(EventLogRepository eventLogRepository) {
        this.eventLogRepository = eventLogRepository;
    }

    @Async
    public void eventFromSystem(String label, EventType eventType, EntityType entityType, UUID referenceId) {
        this.eventLogRepository.save(instance(label, eventType, entityType, referenceId, Instant.now(), true));
    }

    @Async
    public void eventFromSystem(String label, EventType eventType, EntityType entityType, UUID referenceId, Instant referenceDate) {
        this.eventLogRepository.save(instance(label, eventType, entityType, referenceId, referenceDate, true));
    }

    @Async
    public void eventFromUser(String label, EventType eventType, EntityType entityType, UUID referenceId, Instant referenceDate) {
        this.eventLogRepository.save(instance(label, eventType, entityType, referenceId, referenceDate, false));
    }

    public List<EventLog> findAllEventLog(EntityType entityType, UUID referenceId) {
        return this.eventLogRepository.findAllByEntityTypeAndReferenceIdOrderByReferenceDateDesc(entityType, referenceId);
    }

    private static EventLog instance(
        String label,
        EventType eventType,
        EntityType entityType,
        UUID referenceId,
        Instant referenceDate,
        boolean fromSystem
    ) {
        EventLog eventLog = new EventLog();
        eventLog.setLabel(label);
        eventLog.setType(eventType);
        eventLog.setEntityType(entityType);
        eventLog.setReferenceId(referenceId);
        eventLog.setReferenceDate(referenceDate);
        eventLog.setFromSystem(fromSystem);

        return eventLog;
    }
}
