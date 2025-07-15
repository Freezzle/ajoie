package ch.salon.repository;

import ch.salon.domain.VolunteerAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VolunteerAvailabilityRepository extends JpaRepository<VolunteerAvailability, Long> {
    List<VolunteerAvailability> findByVolunteerIdAndTimeSlot_DateAndTimeSlot_Salon_Id(UUID volunteerId, LocalDate date,
            UUID salonId);
}
