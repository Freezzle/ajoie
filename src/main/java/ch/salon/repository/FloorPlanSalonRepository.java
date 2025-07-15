package ch.salon.repository;

import ch.salon.domain.FloorPlanSalon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface FloorPlanSalonRepository extends JpaRepository<FloorPlanSalon, UUID> {
    List<FloorPlanSalon> findBySalonIdOrderByPosition(UUID salonId);
}
