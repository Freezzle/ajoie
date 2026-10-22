package ch.salon.repository;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

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

    /** Nombre d'ateliers actifs par salon : [idSalon, compteur]. */
    @Query("SELECT w.participation.salon.id, COUNT(w) FROM Workshop w WHERE w.status NOT IN :statuses GROUP BY w.participation.salon.id")
    List<Object[]> countBySalonExcludingStatuses(@Param("statuses") List<Status> statuses);
}
