package ch.salon.config;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PresenceBootstrap {

    private final PresenceService presenceService;
    private final UserRepository userRepository;

    private static final Duration BOOT_WINDOW = Duration.ofDays(15);

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void onReady() {
        Instant since = Instant.now().minus(BOOT_WINDOW);

        List<User> users = userRepository.findRecentlyActive(since);
        presenceService.bootstrapFromDb(users);
        presenceService.publishNow();
    }
}