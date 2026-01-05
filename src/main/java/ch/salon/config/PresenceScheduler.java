package ch.salon.config;

import ch.salon.service.PresenceService;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class PresenceScheduler {

    private final PresenceService presence;

    public PresenceScheduler(PresenceService presence) {
        this.presence = presence;
    }

    @Scheduled(fixedDelay = 30_000)
    public void expire() {
        presence.expireStale();
    }
}
