package ch.salon.repository;

import ch.salon.domain.Invoice;
import ch.salon.domain.Payment;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Invoice entity.
 */
@SuppressWarnings("unused")
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByParticipationId(UUID participationId);
}
