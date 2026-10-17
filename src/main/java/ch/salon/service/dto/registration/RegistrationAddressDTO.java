package ch.salon.service.dto.registration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Adresse saisie depuis le formulaire public d'inscription.
 */
@Data
public class RegistrationAddressDTO implements Serializable {

    @Size(max = 255)
    private String formalLine;

    @Size(max = 255)
    private String fullName;

    @Size(max = 255)
    private String postalCase;

    @NotBlank
    @Size(max = 255)
    private String street;

    @Size(max = 20)
    private String houseNumber;

    @NotBlank
    @Size(max = 10)
    private String postalCode;

    @NotBlank
    @Size(max = 255)
    private String city;

    @Size(max = 5)
    private String isoCountry;

    @Size(max = 255)
    private String extraLine;
}
