package ch.salon.repository;

import ch.salon.domain.SubtaskInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubtaskInstanceRepository extends JpaRepository<SubtaskInstance, UUID> {

    List<SubtaskInstance> findByTaskInstanceIdOrderBySortOrderAsc(UUID taskInstanceId);
}


