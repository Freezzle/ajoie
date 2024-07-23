package ch.salon.repository;

import ch.salon.domain.Salon;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Salon entity.
 */
@SuppressWarnings("unused")
@Repository
public interface SalonRepository extends JpaRepository<Salon, UUID> {}
