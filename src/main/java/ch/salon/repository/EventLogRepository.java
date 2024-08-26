package ch.salon.repository;

import ch.salon.domain.EventLog;
import ch.salon.domain.enumeration.EntityType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface EventLogRepository extends JpaRepository<EventLog, UUID> {
    List<EventLog> findAllByEntityTypeAndReferenceIdOrderByReferenceDateDesc(EntityType entityType, UUID id);
}
