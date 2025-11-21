package ch.salon.repository;

import ch.salon.domain.Conference;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConferenceRepository extends JpaRepository<Conference, UUID> {

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Conference> findByParticipationSalonIdOrderByRegistrationDateDesc(UUID salonId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Conference> findByParticipationIdOrderByRegistrationDateDesc(UUID participationId);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Conference> findByParticipationIdAndStatusInOrderByRegistrationDateDesc(UUID participationId, Status... statuses);

    @EntityGraph(attributePaths = {"participation", "participation.exhibitor", "participation.exhibitor.billingAddress"})
    List<Conference> findByStatusInAndParticipation_SalonId(List<Status> statuses, UUID participationId);

    boolean existsConferenceByParticipationIdAndStatusIn(UUID participationId, Status... statuses);
}
