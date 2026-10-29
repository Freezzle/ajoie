package ch.salon.service.volunteer;

import ch.salon.domain.VolunteerAvailabilityDay;
import ch.salon.domain.VolunteerRegistration;
import ch.salon.domain.VolunteerTimeRange;
import ch.salon.domain.enumeration.VolunteerRegistrationStatus;
import ch.salon.repository.VolunteerRegistrationRepository;
import ch.salon.service.dto.volunteer.AdminVolunteerRegistrationDTO;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Opérations admin sur les inscriptions bénévoles (popin du planning) : consultation du détail,
 * renvoi du lien personnel, retrait (statut REMOVED) avec nettoyage du planning.
 * <p>
 * S'exécute dans le contexte tenant déjà établi par le filtre admin authentifié.
 */
@Service
@RequiredArgsConstructor
public class AdminVolunteerRegistrationService {

    private final VolunteerRegistrationRepository registrationRepository;
    private final VolunteerPlanningSyncService syncService;
    private final VolunteerRegistrationEmailService emailService;

    @Transactional(readOnly = true)
    public Optional<AdminVolunteerRegistrationDTO> findByPlanningVolunteerId(UUID salonId, String planningVolunteerId) {
        return registrationRepository.findBySalonIdAndPlanningVolunteerId(salonId, planningVolunteerId).map(this::toDto);
    }

    /** Ids de volontaire (planningVolunteerId) des inscriptions en ligne actives : pour l'icône popin. */
    @Transactional(readOnly = true)
    public List<String> findActivePlanningVolunteerIds(UUID salonId) {
        return registrationRepository
                .findBySalonIdAndStatus(salonId, VolunteerRegistrationStatus.ACTIVE).stream()
                .map(VolunteerRegistration::getPlanningVolunteerId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    public void resendLink(UUID salonId, UUID registrationId) {
        VolunteerRegistration registration = load(salonId, registrationId);
        if (registration.getStatus() == VolunteerRegistrationStatus.REMOVED) {
            throw new BadRequestAlertException("Inscription retirée", PublicVolunteerRegistrationService.ENTITY_NAME,
                    "volunteer-registration.removed");
        }
        emailService.sendReceived(registration.getTenantId(), registrationId, salonId);
    }

    @Transactional
    public void remove(UUID salonId, UUID registrationId) {
        VolunteerRegistration registration = load(salonId, registrationId);
        VolunteerRegistration snapshot = new VolunteerRegistration();
        snapshot.setPlanningVolunteerId(registration.getPlanningVolunteerId());
        snapshot.setStatus(registration.getStatus());

        registration.setStatus(VolunteerRegistrationStatus.REMOVED);
        registration.setLastModifiedDate(Instant.now());
        registrationRepository.save(registration);
        syncService.apply(salonId, snapshot, registration);
    }

    private VolunteerRegistration load(UUID salonId, UUID registrationId) {
        VolunteerRegistration registration = registrationRepository.findById(registrationId).orElseThrow(
                () -> new BadRequestAlertException("Inscription introuvable",
                        PublicVolunteerRegistrationService.ENTITY_NAME, "volunteer-registration.link-invalid"));
        if (registration.getSalon() == null || !salonId.equals(registration.getSalon().getId())) {
            throw new BadRequestAlertException("Inscription introuvable",
                    PublicVolunteerRegistrationService.ENTITY_NAME, "volunteer-registration.link-invalid");
        }
        return registration;
    }

    private AdminVolunteerRegistrationDTO toDto(VolunteerRegistration registration) {
        AdminVolunteerRegistrationDTO dto = new AdminVolunteerRegistrationDTO();
        dto.setId(registration.getId().toString());
        dto.setPlanningVolunteerId(registration.getPlanningVolunteerId());
        dto.setFirstName(registration.getFirstName());
        dto.setLastName(registration.getLastName());
        dto.setEmail(registration.getEmail());
        dto.setPhoneNumber(registration.getPhoneNumber());
        dto.setZoneMode(registration.getZoneMode().name());
        dto.setCategoryIds(new ArrayList<>(registration.getCategoryIds()));
        dto.setNotes(registration.getNotes());
        dto.setStatus(registration.getStatus().name());
        dto.setRegistrationDate(registration.getRegistrationDate());

        List<AdminVolunteerRegistrationDTO.AvailabilityDay> availability = new ArrayList<>();
        for (VolunteerAvailabilityDay day : registration.getAvailability()) {
            AdminVolunteerRegistrationDTO.AvailabilityDay a = new AdminVolunteerRegistrationDTO.AvailabilityDay();
            a.setDayId(day.getDayId());
            a.setAvailable(day.isAvailable());
            a.setRanges(day.getRanges().stream().map(this::toRange).collect(Collectors.toList()));
            availability.add(a);
        }
        dto.setAvailability(availability);
        return dto;
    }

    private AdminVolunteerRegistrationDTO.TimeRange toRange(VolunteerTimeRange range) {
        AdminVolunteerRegistrationDTO.TimeRange tr = new AdminVolunteerRegistrationDTO.TimeRange();
        tr.setStart(range.getStart());
        tr.setEnd(range.getEnd());
        return tr;
    }
}
