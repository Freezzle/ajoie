package ch.salon.repository;

import ch.salon.domain.VolunteerRegistration;
import ch.salon.domain.enumeration.VolunteerRegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VolunteerRegistrationRepository extends JpaRepository<VolunteerRegistration, UUID> {

    Optional<VolunteerRegistration> findBySalonIdAndEmail(UUID salonId, String email);

    List<VolunteerRegistration> findBySalonId(UUID salonId);

    List<VolunteerRegistration> findBySalonIdAndStatus(UUID salonId, VolunteerRegistrationStatus status);

    Optional<VolunteerRegistration> findBySalonIdAndPlanningVolunteerId(UUID salonId, String planningVolunteerId);
}
