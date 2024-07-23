package ch.salon.repository;

import ch.salon.domain.ConfigurationSalon;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the ConfigurationSalon entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ConfigurationSalonRepository extends JpaRepository<ConfigurationSalon, UUID> {}
