package ch.salon.repository;

import ch.salon.aop.logging.RepositoryAction;
import ch.salon.domain.InvoicingPlanReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
@RepositoryAction("billing")
public interface InvoicingPlanReminderRepository extends JpaRepository<InvoicingPlanReminder, UUID> {

    /** Rappels de plusieurs plans en une seule requête, pour éviter un N+1 sur la liste. */
    List<InvoicingPlanReminder> findByInvoicingPlanIdInOrderBySentDateAsc(Collection<UUID> invoicingPlanIds);

    List<InvoicingPlanReminder> findByInvoicingPlanIdOrderBySentDateAsc(UUID invoicingPlanId);
}
