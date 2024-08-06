package ch.salon.repository;

import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Invoice entity.
 */
@SuppressWarnings("unused")
@Repository
public interface InvoicingPlanRepository extends JpaRepository<InvoicingPlan, UUID> {
    List<InvoicingPlan> findByParticipationId(UUID participationId);
}
