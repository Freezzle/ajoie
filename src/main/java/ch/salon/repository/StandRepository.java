package ch.salon.repository;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface StandRepository extends JpaRepository<Stand, UUID> {

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "dimension"})
    List<Stand> findByParticipationSalonIdOrderByRegistrationDateDesc(UUID salonId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "dimension"})
    List<Stand> findByParticipationIdOrderByRegistrationDateDesc(UUID participationId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "dimension"})
    List<Stand> findByParticipationIdAndStatusInOrderByRegistrationDateDesc(UUID participationId, Status... statuses);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress", "dimension"})
    List<Stand> findByStatusInAndParticipation_SalonId(List<Status> statuses, UUID participationId);

    boolean existsStandByParticipationIdAndStatusIn(UUID participationId, Status... statuses);
}
