package ch.salon.service.dto.waitlist;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;

/**
 * Demande d'inscription à la liste d'attente de la plateforme (section « La plateforme ouvre bientôt »
 * de la page d'accueil publique).
 */
@Data
public class WaitlistSubscriptionRequestDTO implements Serializable {

    @NotBlank
    @Email
    private String email;
}
