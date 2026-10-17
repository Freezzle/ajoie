package ch.salon.service.registration;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Limiteur de débit très simple, en mémoire, pour les endpoints publics d'inscription.
 * Protège contre les envois massifs depuis une même adresse IP.
 */
@Component
public class RegistrationRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(10);

    /** Quota par IP cliente déclarée (X-Forwarded-For, falsifiable). */
    public static final int CLIENT_MAX_ATTEMPTS = MAX_ATTEMPTS;
    /** Quota par connexion TCP réelle : reste efficace même si X-Forwarded-For est falsifié. */
    public static final int REMOTE_MAX_ATTEMPTS = 30;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * @return true si la requête est autorisée, false si le quota est dépassé.
     */
    public boolean tryAcquire(String key, int maxAttempts) {
        if (key == null || key.isBlank()) {
            return true;
        }

        Instant now = Instant.now();
        Window window = windows.compute(key, (k, current) -> {
            if (current == null || current.startedAt.plus(WINDOW).isBefore(now)) {
                return new Window(now);
            }
            return current;
        });

        purgeExpired(now);

        return window.count.incrementAndGet() <= maxAttempts;
    }

    private void purgeExpired(Instant now) {
        windows.entrySet().removeIf(entry -> entry.getValue().startedAt.plus(WINDOW).isBefore(now));
    }

    private static final class Window {
        private final Instant startedAt;
        private final AtomicInteger count = new AtomicInteger();

        private Window(Instant startedAt) {
            this.startedAt = startedAt;
        }
    }
}
