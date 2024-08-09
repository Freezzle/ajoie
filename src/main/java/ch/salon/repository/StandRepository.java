package ch.salon.repository;

import ch.salon.domain.Stand;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Stand entity.
 */
@SuppressWarnings("unused")
@Repository
public interface StandRepository extends JpaRepository<Stand, UUID> {
    List<Stand> findByParticipationSalonId(UUID salonId);

    List<Stand> findByParticipationId(UUID participationId);
}
