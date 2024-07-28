package ch.salon.repository;

import ch.salon.domain.Stand;
import ch.salon.web.rest.StandResource;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Stand entity.
 */
@SuppressWarnings("unused")
@Repository
public interface StandRepository extends JpaRepository<Stand, UUID> {
    List<Stand> findAllStandsBySalon_Id(UUID idSalon);
}
