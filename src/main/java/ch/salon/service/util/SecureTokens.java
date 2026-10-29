package ch.salon.service.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Génération et comparaison de jetons sécurisés, partagés par les parcours publics
 * (inscription exposant et inscription bénévole).
 */
public final class SecureTokens {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;

    private SecureTokens() {}

    /** Jeton aléatoire de 32 octets, encodé en Base64 URL sans padding. */
    public static String generate() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Comparaison à temps constant de deux jetons (protège des attaques temporelles). */
    public static boolean matches(String expected, String provided) {
        if (expected == null || provided == null || expected.isBlank() || provided.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), provided.getBytes(StandardCharsets.UTF_8));
    }
}
