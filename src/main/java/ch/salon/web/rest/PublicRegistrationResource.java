package ch.salon.web.rest;

import ch.salon.service.captcha.CaptchaVerificationService;
import ch.salon.service.dto.registration.PublicSalonInfoDTO;
import ch.salon.service.dto.registration.RegistrationRequestDTO;
import ch.salon.service.dto.registration.RegistrationResponseDTO;
import ch.salon.service.registration.PublicRegistrationService;
import ch.salon.service.registration.RegistrationRateLimiter;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
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
 * Endpoints publics (anonymes) du formulaire d'inscription des exposants.
 * <p>
 * Aucun champ interne n'est accepté ni renvoyé : les DTO {@code registration.*} sont dédiés
 * et ne réutilisent jamais les DTO d'administration.
 */
@RestController
@RequestMapping("/api/public/registrations")
@RequiredArgsConstructor
public class PublicRegistrationResource {

    private final PublicRegistrationService publicRegistrationService;
    private final CaptchaVerificationService captchaVerificationService;
    private final RegistrationRateLimiter rateLimiter;

    /**
     * Configuration publique du widget captcha.
     */
    @GetMapping("/captcha-config")
    public ResponseEntity<Map<String, Object>> getCaptchaConfig() {
        return ResponseEntity.ok(Map.of("enabled", captchaVerificationService.isEnabled(), "siteKey",
                StringUtils.defaultString(captchaVerificationService.getSiteKey())));
    }

    /**
     * Informations publiques du salon ciblé par le lien d'inscription.
     */
    @GetMapping("/salons/{salonId}")
    public ResponseEntity<PublicSalonInfoDTO> getSalonInfo(@PathVariable UUID salonId) {
        return ResponseEntity.ok(publicRegistrationService.getSalonInfo(salonId));
    }

    @PostMapping("/salons/{salonId}")
    public ResponseEntity<RegistrationResponseDTO> register(@PathVariable UUID salonId,
            @Valid @RequestBody RegistrationRequestDTO request, HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);

        assertNotRateLimited(httpRequest, clientIp);

        if (!captchaVerificationService.verify(request.getCaptchaToken(), clientIp)) {
            throw new BadRequestAlertException("Vérification anti-robot échouée",
                    PublicRegistrationService.ENTITY_NAME, "registration.captcha-invalid");
        }

        return ResponseEntity.ok(publicRegistrationService.register(salonId, request));
    }

    /**
     * Relecture d'une inscription via le lien reçu par e-mail.
     */
    @GetMapping("/salons/{salonId}/{participationId}/{token}")
    public ResponseEntity<RegistrationRequestDTO> getRegistration(@PathVariable UUID salonId,
            @PathVariable UUID participationId, @PathVariable String token) {
        return ResponseEntity.ok(publicRegistrationService.getRegistration(salonId, participationId, token));
    }

    @PutMapping("/salons/{salonId}/{participationId}/{token}")
    public ResponseEntity<RegistrationResponseDTO> updateRegistration(@PathVariable UUID salonId,
            @PathVariable UUID participationId, @PathVariable String token,
            @Valid @RequestBody RegistrationRequestDTO request, HttpServletRequest httpRequest) {

        assertNotRateLimited(httpRequest, resolveClientIp(httpRequest));

        return ResponseEntity.ok(
                publicRegistrationService.updateRegistration(salonId, participationId, token, request));
    }

    /**
     * Double quota : par IP cliente déclarée (fine) et par connexion TCP réelle (plus large), afin
     * qu'un {@code X-Forwarded-For} falsifié ne permette pas de contourner la limite.
     */
    private void assertNotRateLimited(HttpServletRequest httpRequest, String clientIp) {
        boolean allowed = rateLimiter.tryAcquire(clientIp, RegistrationRateLimiter.CLIENT_MAX_ATTEMPTS);
        allowed &= rateLimiter.tryAcquire("remote:" + httpRequest.getRemoteAddr(),
                RegistrationRateLimiter.REMOTE_MAX_ATTEMPTS);

        if (!allowed) {
            throw new BadRequestAlertException("Trop de tentatives, réessayez plus tard",
                    PublicRegistrationService.ENTITY_NAME, "registration.rate-limited");
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
