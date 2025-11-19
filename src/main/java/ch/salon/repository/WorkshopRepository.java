package ch.salon.repository;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface WorkshopRepository extends JpaRepository<Workshop, UUID> {

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Workshop> findByParticipationSalonIdOrderByRegistrationDateDesc(UUID salonId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Workshop> findByParticipationIdOrderByRegistrationDateDesc(UUID participationId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Workshop> findByParticipationIdAndStatusInOrderByRegistrationDateDesc(UUID participationId, Status... statuses);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Workshop> findByStatusInAndParticipation_SalonId(List<Status> statuses, UUID participationId);

    boolean existsWorkshopByParticipationIdAndStatusIn(UUID participationId, Status... statuses);
}
