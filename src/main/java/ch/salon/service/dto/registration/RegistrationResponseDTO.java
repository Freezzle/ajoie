package ch.salon.service.dto.registration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Réponse renvoyée après une inscription publique.
 * Ne contient jamais le jeton de modification : celui-ci n'est transmis que par e-mail.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponseDTO implements Serializable {

    private UUID participationId;
    private String firstName;
    private String email;
}
