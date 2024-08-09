package ch.salon.domain;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    public static String instantToIso(Instant instant) {
        if (instant == null) {
            return null;
        }

        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        return instant.atZone(ZoneId.of("UTC")).toLocalDate().format(outputFormatter);
    }
}
