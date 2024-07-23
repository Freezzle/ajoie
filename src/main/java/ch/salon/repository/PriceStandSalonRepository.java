package ch.salon.repository;

import ch.salon.domain.PriceStandSalon;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the PriceStandSalon entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PriceStandSalonRepository extends JpaRepository<PriceStandSalon, UUID> {}
