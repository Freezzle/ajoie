package ch.salon.repository;

import ch.salon.domain.Conference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for the Conference entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ConferenceRepository extends JpaRepository<Conference, UUID> {
    List<Conference> findByParticipationSalonId(UUID salonId);

    List<Conference> findByParticipationId(UUID participationId);
}
