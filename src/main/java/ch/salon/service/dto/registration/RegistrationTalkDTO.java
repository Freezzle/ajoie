package ch.salon.service.dto.registration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Conférence ou atelier saisi depuis le formulaire public d'inscription.
 */
@Data
public class RegistrationTalkDTO implements Serializable {

    @NotBlank
    @Size(max = 500)
    private String title;

    @NotBlank
    @Size(max = 500)
    private String description;
}
