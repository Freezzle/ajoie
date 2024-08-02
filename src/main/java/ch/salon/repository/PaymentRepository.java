package ch.salon.repository;

import ch.salon.domain.Payment;
import ch.salon.domain.Stand;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Payment entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByParticipationId(UUID participationId);
}
