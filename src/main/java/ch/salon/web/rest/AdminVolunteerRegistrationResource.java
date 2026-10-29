package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.dto.volunteer.AdminVolunteerRegistrationDTO;
import ch.salon.service.volunteer.AdminVolunteerRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoints admin pour la popin des inscriptions bénévoles dans le planning.
 */
@RestController
@RequestMapping("/api/admin/salons/{salonId}/volunteer-registrations")
@Transactional
@RequiredArgsConstructor
public class AdminVolunteerRegistrationResource {

    private final AdminVolunteerRegistrationService service;

    @GetMapping("/by-planning/{planningVolunteerId}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<AdminVolunteerRegistrationDTO> getByPlanningVolunteer(@PathVariable UUID salonId,
            @PathVariable String planningVolunteerId) {
        return service.findByPlanningVolunteerId(salonId, planningVolunteerId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/planning-ids")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<java.util.List<String>> getActivePlanningVolunteerIds(@PathVariable UUID salonId) {
        return ResponseEntity.ok(service.findActivePlanningVolunteerIds(salonId));
    }

    @PostMapping("/{registrationId}/resend-link")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> resendLink(@PathVariable UUID salonId, @PathVariable UUID registrationId) {
        service.resendLink(salonId, registrationId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{registrationId}/remove")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> remove(@PathVariable UUID salonId, @PathVariable UUID registrationId) {
        service.remove(salonId, registrationId);
        return ResponseEntity.noContent().build();
    }
}
