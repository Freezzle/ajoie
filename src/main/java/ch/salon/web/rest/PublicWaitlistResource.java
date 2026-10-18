package ch.salon.web.rest;

import ch.salon.service.dto.waitlist.WaitlistSubscriptionRequestDTO;
import ch.salon.service.registration.RegistrationRateLimiter;
import ch.salon.service.waitlist.PublicWaitlistService;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint public (anonyme) d'inscription à la liste d'attente de la plateforme, utilisé par la
 * section « La plateforme ouvre bientôt » de la page d'accueil publique.
 */
@RestController
@RequestMapping("/api/public/waitlist")
@RequiredArgsConstructor
public class PublicWaitlistResource {

    private final PublicWaitlistService publicWaitlistService;
    private final RegistrationRateLimiter rateLimiter;

    @PostMapping
    public ResponseEntity<Void> subscribe(@Valid @RequestBody WaitlistSubscriptionRequestDTO request,
            HttpServletRequest httpRequest) {

        assertNotRateLimited(httpRequest, resolveClientIp(httpRequest));

        publicWaitlistService.subscribe(request.getEmail());

        return ResponseEntity.noContent().build();
    }

    /**
     * Même logique de double quota que les autres endpoints publics (voir {@link PublicRegistrationResource}) :
     * par IP cliente déclarée (fine) et par connexion TCP réelle (plus large).
     */
    private void assertNotRateLimited(HttpServletRequest httpRequest, String clientIp) {
        boolean allowed = rateLimiter.tryAcquire(clientIp, RegistrationRateLimiter.CLIENT_MAX_ATTEMPTS);
        allowed &= rateLimiter.tryAcquire("remote:" + httpRequest.getRemoteAddr(),
                RegistrationRateLimiter.REMOTE_MAX_ATTEMPTS);

        if (!allowed) {
            throw new BadRequestAlertException("Trop de tentatives, réessayez plus tard",
                    PublicWaitlistService.ENTITY_NAME, "waitlist.rate-limited");
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
