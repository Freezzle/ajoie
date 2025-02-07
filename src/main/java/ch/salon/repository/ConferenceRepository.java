package ch.salon.repository;

import ch.salon.domain.Conference;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface ConferenceRepository extends JpaRepository<Conference, UUID> {
    List<Conference> findByParticipationSalonId(UUID salonId);

    List<Conference> findByParticipationId(UUID participationId);

    List<Conference> findByStatusInAndParticipation_SalonId(List<Status> statuses, UUID participationId);
}
