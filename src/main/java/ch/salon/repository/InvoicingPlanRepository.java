package ch.salon.repository;

import ch.salon.domain.InvoicingPlan;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface InvoicingPlanRepository extends JpaRepository<InvoicingPlan, UUID> {
    List<InvoicingPlan> findByParticipationIdOrderByBillingNumberDesc(UUID participationId);
}
