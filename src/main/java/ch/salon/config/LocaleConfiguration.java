package ch.salon.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.nio.charset.StandardCharsets;

/**
 * Configuration pour la gestion des messages i18n avec encodage UTF-8.
 */
@Configuration
public class LocaleConfiguration {

    /**
     * Configure le MessageSource pour lire les fichiers messages_*.properties en UTF-8.
     * Par défaut, Spring Boot utilise ISO-8859-1 pour les fichiers .properties,
     * ce qui cause des problèmes d'affichage des caractères accentués.
     */
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("i18n/messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setFallbackToSystemLocale(false);
        messageSource.setUseCodeAsDefaultMessage(true);
        return messageSource;
    }
}
