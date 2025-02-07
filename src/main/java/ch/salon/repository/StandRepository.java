package ch.salon.repository;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface StandRepository extends JpaRepository<Stand, UUID> {
    List<Stand> findByParticipationSalonId(UUID salonId);

    List<Stand> findByParticipationId(UUID participationId);

    List<Stand> findByStatusInAndParticipation_SalonId(List<Status> statuses, UUID participationId);
}
