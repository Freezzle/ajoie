package ch.salon.repository;

import ch.salon.domain.EventLog;
import ch.salon.domain.enumeration.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface EventLogRepository extends JpaRepository<EventLog, UUID> {
    List<EventLog> findAllByEntityTypeAndReferenceIdOrderByReferenceDateAsc(EntityType entityType, UUID id);
}
