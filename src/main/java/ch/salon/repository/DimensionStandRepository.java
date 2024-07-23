package ch.salon.repository;

import ch.salon.domain.DimensionStand;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the DimensionStand entity.
 */
@SuppressWarnings("unused")
@Repository
public interface DimensionStandRepository extends JpaRepository<DimensionStand, UUID> {}
