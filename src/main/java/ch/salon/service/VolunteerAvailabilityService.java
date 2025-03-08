package ch.salon.service;

import ch.salon.domain.VolunteerAvailability;
import ch.salon.repository.VolunteerAvailabilityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class VolunteerAvailabilityService {

    private final VolunteerAvailabilityRepository availabilityRepository;

    public VolunteerAvailabilityService(VolunteerAvailabilityRepository repository) {
        this.availabilityRepository = repository;
    }

    public List<VolunteerAvailability> getAvailabilities(UUID volunteerId, UUID idSalon, LocalDate date) {
        return availabilityRepository.findByVolunteerIdAndTimeSlot_DateAndTimeSlot_Salon_Id(volunteerId, date, idSalon);
    }
}
