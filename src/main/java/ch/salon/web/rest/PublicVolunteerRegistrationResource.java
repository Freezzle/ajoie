package ch.salon.web.rest;

import ch.salon.service.captcha.CaptchaVerificationService;
import ch.salon.service.dto.volunteer.PublicVolunteerSalonInfoDTO;
import ch.salon.service.dto.volunteer.VolunteerRegistrationDTO;
import ch.salon.service.dto.volunteer.VolunteerRegistrationRequestDTO;
import ch.salon.service.dto.volunteer.VolunteerRegistrationResponseDTO;
import ch.salon.service.dto.volunteer.VolunteerResendLinkDTO;
import ch.salon.service.registration.RegistrationRateLimiter;
import ch.salon.service.volunteer.PublicVolunteerRegistrationService;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Endpoints publics (anonymes) du formulaire d'inscription des bénévoles.
 * DTO {@code volunteer.*} dédiés : ne réutilisent jamais les DTO d'administration et n'exposent
 * ni besoins, ni affectations, ni nombre d'inscrits.
 */
@RestController
@RequestMapping("/api/public/volunteer-registrations")
@RequiredArgsConstructor
public class PublicVolunteerRegistrationResource {

    private final PublicVolunteerRegistrationService service;
    private final CaptchaVerificationService captchaVerificationService;
    private final RegistrationRateLimiter rateLimiter;

    @GetMapping("/captcha-config")
    public ResponseEntity<Map<String, Object>> getCaptchaConfig() {
        return ResponseEntity.ok(Map.of("enabled", captchaVerificationService.isEnabled(), "siteKey",
                StringUtils.defaultString(captchaVerificationService.getSiteKey())));
    }

    @GetMapping("/salons/{salonId}")
    public ResponseEntity<PublicVolunteerSalonInfoDTO> getSalonInfo(@PathVariable UUID salonId) {
        return ResponseEntity.ok(service.getSalonInfo(salonId));
    }

    @PostMapping("/salons/{salonId}")
    public ResponseEntity<VolunteerRegistrationResponseDTO> register(@PathVariable UUID salonId,
            @Valid @RequestBody VolunteerRegistrationRequestDTO request, HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        assertNotRateLimited(httpRequest, clientIp);

        if (!captchaVerificationService.verify(request.getCaptchaToken(), clientIp)) {
            throw new BadRequestAlertException("Vérification anti-robot échouée",
                    PublicVolunteerRegistrationService.ENTITY_NAME, "volunteer-registration.captcha-invalid");
        }

        return ResponseEntity.ok(service.register(salonId, request));
    }

    @GetMapping("/salons/{salonId}/{registrationId}/{token}")
    public ResponseEntity<VolunteerRegistrationDTO> getRegistration(@PathVariable UUID salonId,
            @PathVariable UUID registrationId, @PathVariable String token) {
        return ResponseEntity.ok(service.getRegistration(salonId, registrationId, token));
    }

    @PutMapping("/salons/{salonId}/{registrationId}/{token}")
    public ResponseEntity<VolunteerRegistrationResponseDTO> updateRegistration(@PathVariable UUID salonId,
            @PathVariable UUID registrationId, @PathVariable String token,
            @Valid @RequestBody VolunteerRegistrationRequestDTO request, HttpServletRequest httpRequest) {

        assertNotRateLimited(httpRequest, resolveClientIp(httpRequest));
        return ResponseEntity.ok(service.updateRegistration(salonId, registrationId, token, request));
    }

    @DeleteMapping("/salons/{salonId}/{registrationId}/{token}")
    public ResponseEntity<Void> cancel(@PathVariable UUID salonId, @PathVariable UUID registrationId,
            @PathVariable String token, HttpServletRequest httpRequest) {

        assertNotRateLimited(httpRequest, resolveClientIp(httpRequest));
        service.cancel(salonId, registrationId, token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/salons/{salonId}/resend-link")
    public ResponseEntity<Void> resendLink(@PathVariable UUID salonId, @RequestBody VolunteerResendLinkDTO request,
            HttpServletRequest httpRequest) {

        assertNotRateLimited(httpRequest, resolveClientIp(httpRequest));
        if (StringUtils.isNotBlank(request.email())) {
            service.resendLink(salonId, request.email());
        }
        // Toujours 200 : pas d'énumération d'e-mails.
        return ResponseEntity.ok().build();
    }

    private void assertNotRateLimited(HttpServletRequest httpRequest, String clientIp) {
        boolean allowed = rateLimiter.tryAcquire(clientIp, RegistrationRateLimiter.CLIENT_MAX_ATTEMPTS);
        allowed &= rateLimiter.tryAcquire("remote:" + httpRequest.getRemoteAddr(),
                RegistrationRateLimiter.REMOTE_MAX_ATTEMPTS);

        if (!allowed) {
            throw new BadRequestAlertException("Trop de tentatives, réessayez plus tard",
                    PublicVolunteerRegistrationService.ENTITY_NAME, "volunteer-registration.rate-limited");
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.isNotBlank(forwarded)) {
            return StringUtils.trimToEmpty(StringUtils.split(forwarded, ',')[0]);
        }
        return request.getRemoteAddr();
    }
}
