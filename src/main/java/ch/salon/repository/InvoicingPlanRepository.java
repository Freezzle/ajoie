package ch.salon.repository;

import ch.salon.domain.InvoicingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for the Invoice entity.
 */
@SuppressWarnings("unused")
@Repository
public interface InvoicingPlanRepository extends JpaRepository<InvoicingPlan, UUID> {
    List<InvoicingPlan> findByParticipationId(UUID participationId);
}
