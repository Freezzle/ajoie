package ch.salon.service.task;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
public class WeeklyTaskDigestScheduler {

    private static final ZoneId ZONE = ZoneId.of("Europe/Zurich");

    private final WeeklyTaskDigestService weeklyTaskDigestService;

    /** Tous les lundis à 06h00, heure de Zurich. */
    @Scheduled(cron = "0 0 6 * * MON", zone = "Europe/Zurich")
    public void sendWeeklyDigest() {
        weeklyTaskDigestService.sendWeeklyDigests(LocalDate.now(ZONE));
    }
}
