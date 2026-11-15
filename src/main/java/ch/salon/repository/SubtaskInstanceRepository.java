package ch.salon.repository;

import ch.salon.domain.SubtaskInstance;
import ch.salon.domain.enumeration.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubtaskInstanceRepository extends JpaRepository<SubtaskInstance, UUID> {

    List<SubtaskInstance> findByTaskInstanceIdOrderBySortOrderAsc(UUID taskInstanceId);

    @Query("""
        select s from SubtaskInstance s
        join fetch s.taskInstance t
        join fetch t.salon sa
        where s.status not in :excludedStatuses
          and s.dueDate is not null
          and coalesce(s.snoozedUntil, s.dueDate) <= :weekEnd
          and (sa.endingDate is null or sa.endingDate >= :salonNotEndedBefore)
        order by sa.id, coalesce(s.snoozedUntil, s.dueDate), t.sortOrder, s.sortOrder
        """)
    List<SubtaskInstance> findOpenSubtasksForDigest(
        @Param("excludedStatuses") Collection<TaskStatus> excludedStatuses,
        @Param("weekEnd") LocalDate weekEnd,
        @Param("salonNotEndedBefore") Instant salonNotEndedBefore);
}


