package ch.salon.repository;

import ch.salon.domain.FloorPlanSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FloorPlanSettingsRepository extends JpaRepository<FloorPlanSettings, UUID> {
    Optional<FloorPlanSettings> findBySalonId(UUID salonId);
}
