package ch.salon.service.captcha;

import ch.salon.utils.SalonProperties;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Vérification d'un jeton Cloudflare Turnstile auprès de l'API {@code siteverify}.
 * Désactivable via {@code salon.security.captcha.enabled} (dev / tests).
 */
@Service
public class CaptchaVerificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CaptchaVerificationService.class);

    private final SalonProperties salonProperties;
    private final RestClient restClient;

    public CaptchaVerificationService(SalonProperties salonProperties) {
        this.salonProperties = salonProperties;
        // Client autonome : l'auto-configuration de RestClient.Builder n'est pas disponible ici.
        this.restClient = RestClient.create();
    }

    public boolean isEnabled() {
        return salonProperties.getSecurity().getCaptcha().isEnabled();
    }

    public String getSiteKey() {
        return salonProperties.getSecurity().getCaptcha().getSiteKey();
    }

    /**
     * @return true si le jeton est valide (ou si le captcha est désactivé).
     */
    public boolean verify(String token, String remoteIp) {
        SalonProperties.Security.Captcha config = salonProperties.getSecurity().getCaptcha();

        if (!config.isEnabled()) {
            return true;
        }

        if (StringUtils.isBlank(token)) {
            return false;
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", config.getSecretKey());
        form.add("response", token);
        if (StringUtils.isNotBlank(remoteIp)) {
            form.add("remoteip", remoteIp);
        }

        try {
            TurnstileResponse response = restClient.post()
                                                   .uri(config.getVerifyUrl())
                                                   .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                                   .body(form)
                                                   .retrieve()
                                                   .body(TurnstileResponse.class);

            if (response == null || !response.isSuccess()) {
                LOGGER.warn("Captcha verification failed: {}",
                        response == null ? "no response" : response.getErrorCodes());
                return false;
            }
            return true;
        } catch (Exception e) {
            LOGGER.error("Captcha verification call failed", e);
            return false;
        }
    }

    @Data
    static class TurnstileResponse {
        private boolean success;

        @com.fasterxml.jackson.annotation.JsonProperty("error-codes")
        private List<String> errorCodes;
    }
}
