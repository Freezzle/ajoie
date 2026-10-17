package ch.salon.service.dto.registration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Exposant (personne de contact) saisi depuis le formulaire public d'inscription.
 * Ne contient volontairement aucun champ interne (redFlag, duplicateDetected, extraInformation...).
 */
@Data
public class RegistrationExhibitorDTO implements Serializable {

    @NotBlank
    @Size(max = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    private String lastName;

    @NotBlank
    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 50)
    private String phoneNumber;

    @Size(max = 5)
    private String language;

    @NotNull
    @Valid
    private RegistrationAddressDTO homeAddress;

    private boolean differentBillingAddress;

    @Valid
    private RegistrationAddressDTO billingAddress;

    private boolean newsletter = true;
}
