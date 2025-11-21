package ch.salon.repository;

import ch.salon.domain.PlanningTalksSalon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PlanningTalksSalonRepository extends JpaRepository<PlanningTalksSalon, UUID> {

    PlanningTalksSalon findBySalonId(UUID salonId);
}
