package ch.salon.repository;

import ch.salon.domain.EventLog;
import ch.salon.domain.enumeration.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventLogRepository extends JpaRepository<EventLog, UUID> {
    List<EventLog> findAllByEntityTypeAndReferenceIdOrderByReferenceDateAsc(EntityType entityType, UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE EventLog e SET e.referenceId = :targetId WHERE e.entityType = :entityType AND e.referenceId = :duplicateId")
    int moveReference(@Param("entityType") EntityType entityType, @Param("duplicateId") UUID duplicateId,
            @Param("targetId") UUID targetId);
}
