package ch.salon.config;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.service.PresenceService;
import ch.salon.security.tenant.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresenceBootstrap {

    private final PresenceService presenceService;
    private final UserRepository userRepository;

    private static final Duration BOOT_WINDOW = Duration.ofDays(15);

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void onReady() {
        TenantContextHolder.runAsSystem(() -> {
            Instant since = Instant.now().minus(BOOT_WINDOW);
            List<User> users = userRepository.findRecentlyActive(since);

            Map<UUID, List<User>> usersByTenant = users.stream()
                    .collect(Collectors.groupingBy(User::getTenantId));

            presenceService.bootstrapFromDb(usersByTenant);
            presenceService.publishNow();
        });
    }
}