package ch.salon.utils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    /**
     * Fuseau métier du salon. Les dates saisies par l'admin et affichées par le frontend
     * sont des dates civiles suisses : elles ne doivent jamais dépendre du fuseau de la JVM
     * (UTC sur le serveur déployé), sous peine de décalage d'un jour.
     */
    public static final ZoneId SALON_ZONE = ZoneId.of("Europe/Zurich");

    public static String instantToIso(Instant instant) {
        if (instant == null) {
            return null;
        }

        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        return instant.atZone(SALON_ZONE).toLocalDate().format(outputFormatter);
    }

    /** Date civile suisse d'un instant (par exemple la date de début d'un salon). */
    public static LocalDate toSalonDate(Instant instant) {
        return instant == null ? null : instant.atZone(SALON_ZONE).toLocalDate();
    }

    /** Aujourd'hui, en date civile suisse. */
    public static LocalDate salonToday() {
        return LocalDate.now(SALON_ZONE);
    }
}
