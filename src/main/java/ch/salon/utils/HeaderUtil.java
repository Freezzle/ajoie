package ch.salon.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Slf4j
@Component
public class HeaderUtil {

    private static MessageSource messageSource;

    public HeaderUtil(MessageSource messageSource) {
        HeaderUtil.messageSource = messageSource;
    }

    public static HttpHeaders createAlert(String applicationName, String messageKey, String param) {
        HttpHeaders headers = new HttpHeaders();

        // Récupérer la locale courante
        Locale locale = LocaleContextHolder.getLocale();

        // Traduire le message si messageSource est disponible
        String translatedMessage = messageKey;
        if (messageSource != null) {
            try {
                translatedMessage = messageSource.getMessage(messageKey, null, locale);
            } catch (Exception e) {
                log.warn("Translation not found for key: {} in locale: {}, using key as fallback", messageKey, locale);
                translatedMessage = messageKey;
            }
        }

        headers.add("X-" + applicationName + "-alert-key", messageKey);
        headers.add("X-" + applicationName + "-alert", translatedMessage);
        headers.add("X-" + applicationName + "-params", URLEncoder.encode(param, StandardCharsets.UTF_8));

        return headers;
    }

    public static HttpHeaders createEntityCreationAlert(String applicationName, String messageKey, String param) {
        return createAlert(applicationName,  applicationName + "." + messageKey, param);
    }

    public static HttpHeaders createEntityUpdateAlert(String applicationName, String messageKey, String param) {
        return createAlert(applicationName,  applicationName + "." + messageKey, param);
    }

    public static HttpHeaders createEntityDeletionAlert(String applicationName, String messageKey, String param) {
        return createAlert(applicationName,  applicationName + "." + messageKey, param);
    }

    public static HttpHeaders createEntityCreationAlert(String applicationName, boolean enableTranslation, String entityName, String param) {
        String messageKey = enableTranslation ? applicationName + "." + entityName + ".created" : "A new " + entityName + " is created with identifier " + param;
        return createAlert(applicationName, messageKey, param);
    }

    public static HttpHeaders createEntityUpdateAlert(String applicationName, boolean enableTranslation, String entityName, String param) {
        String messageKey = enableTranslation ? applicationName + "." + entityName + ".updated" : "A " + entityName + " is updated with identifier " + param;
        return createAlert(applicationName, messageKey, param);
    }

    public static HttpHeaders createEntityDeletionAlert(String applicationName, boolean enableTranslation, String entityName, String param) {
        String messageKey = enableTranslation ? applicationName + "." + entityName + ".deleted" : "A " + entityName + " is deleted with identifier " + param;
        return createAlert(applicationName, messageKey, param);
    }

    public static HttpHeaders createFailureAlert(String applicationName, boolean enableTranslation, String entityName, String errorKey, String defaultMessage) {
        log.error("Entity processing failed, {}", defaultMessage);

        // Récupérer la locale courante
        Locale locale = LocaleContextHolder.getLocale();

        String messageKey = enableTranslation ? "error." + errorKey : defaultMessage;
        String translatedMessage = messageKey;

        // Traduire le message d'erreur si messageSource est disponible et enableTranslation est true
        if (messageSource != null && enableTranslation) {
            try {
                translatedMessage = messageSource.getMessage(messageKey, null, locale);
            } catch (Exception e) {
                log.warn("Translation not found for error key: {} in locale: {}, using default message", messageKey, locale);
                translatedMessage = defaultMessage;
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add("X-" + applicationName + "-error", translatedMessage);
        headers.add("X-" + applicationName + "-params", entityName);
        return headers;
    }
}
