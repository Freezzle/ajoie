package ch.salon.repository;

import ch.salon.domain.SalonSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalonSettingsRepository extends JpaRepository<SalonSettings, UUID> {
    Optional<SalonSettings> findBySalonId(UUID salonId);
}
