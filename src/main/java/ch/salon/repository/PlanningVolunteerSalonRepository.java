package ch.salon.repository;

import ch.salon.domain.PlanningVolunteerSalon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PlanningVolunteerSalonRepository extends JpaRepository<PlanningVolunteerSalon, UUID> {

    PlanningVolunteerSalon findBySalonId(UUID salonId);
}
