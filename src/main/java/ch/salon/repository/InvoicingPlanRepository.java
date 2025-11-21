package ch.salon.repository;

import ch.salon.aop.logging.RepositoryAction;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.State;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
@RepositoryAction("billing")
public interface InvoicingPlanRepository extends JpaRepository<InvoicingPlan, UUID> {

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "invoices", "payments"})
    List<InvoicingPlan> findByParticipationIdOrderByBillingNumberAsc(UUID participationId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "invoices", "payments"})
    List<InvoicingPlan> findByParticipationIdOrderByBillingNumberDesc(UUID participationId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "invoices", "payments"})
    InvoicingPlan findFirstByParticipationIdOrderByBillingNumberDesc(UUID participationId);

    @EntityGraph(attributePaths = {"participation"})
    InvoicingPlan findFirstByParticipationIdAndStateOrderByBillingNumberDesc(UUID participationId, State state);

    @EntityGraph(attributePaths = {"participation", "participation.salon", "invoices", "payments"})
    List<InvoicingPlan> findByParticipation_IdInAndParticipation_Salon_IdOrderByBillingNumberDesc(
            List<UUID> idParticipations, UUID salonId);

    @EntityGraph(attributePaths = {"participation", "participation.salon", "invoices", "payments"})
    List<InvoicingPlan> findByParticipation_Salon_Id(UUID salonId);
}
