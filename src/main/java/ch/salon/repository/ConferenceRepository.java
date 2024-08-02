package ch.salon.repository;

import ch.salon.domain.Conference;
import ch.salon.domain.Stand;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Conference entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ConferenceRepository extends JpaRepository<Conference, UUID> {
    List<Conference> findByParticipationSalonId(UUID salonId);
}
