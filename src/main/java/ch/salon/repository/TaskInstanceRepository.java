package ch.salon.repository;

import ch.salon.domain.TaskInstance;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaskInstanceRepository extends JpaRepository<TaskInstance, UUID> {


    @EntityGraph(attributePaths = {"subtasks"})
    List<TaskInstance> findBySalonIdOrderBySortOrderAsc(UUID salonId);

    /** Charge l'instance avec ses sous-tâches (sans comments pour éviter MultipleBagFetchException). */
    @EntityGraph(attributePaths = {"subtasks"})
    Optional<TaskInstance> findWithSubtasksById(UUID id);

    /** Charge l'instance avec ses commentaires uniquement. */
    @EntityGraph(attributePaths = {"comments"})
    Optional<TaskInstance> findWithCommentsById(UUID id);
}
