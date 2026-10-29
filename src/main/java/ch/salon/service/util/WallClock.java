package ch.salon.service.util;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Normalise une heure d'horloge en "HH:mm".
 * <p>
 * Les jours du planning bénévoles sont enregistrés par l'admin au format ISO UTC
 * (ex. "2000-01-01T07:00:00.000Z"), alors que le parcours public et la synchronisation
 * raisonnent en heures locales "HH:mm". On convertit dans le fuseau du salon (Europe/Zurich,
 * la date de référence 2000-01-01 étant toujours en heure d'hiver CET).
 */
public final class WallClock {

    private static final ZoneId ZONE = ZoneId.of("Europe/Zurich");
    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private WallClock() {}

    public static String hhmm(String raw) {
        if (raw == null || raw.isBlank()) {
            return "00:00";
        }
        // Déjà au format HH:mm (ou H:mm) : on normalise le padding.
        if (raw.matches("^\\d{1,2}:\\d{2}$")) {
            String[] parts = raw.split(":");
            return String.format("%02d:%02d", Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
        }
        try {
            Instant instant = Instant.parse(raw);
            return LocalTime.ofInstant(instant, ZONE).format(HHMM);
        } catch (Exception e) {
            return "00:00";
        }
    }
}
