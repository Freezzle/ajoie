package ch.salon.service.dto.registration;

import ch.salon.domain.enumeration.Category;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Stand saisi depuis le formulaire public d'inscription.
 */
@Data
public class RegistrationStandDTO implements Serializable {

    @NotBlank
    @Size(max = 500)
    private String description;

    @NotNull
    private UUID dimensionId;

    @NotNull
    private Category category;

    private Set<String> subCategories = new LinkedHashSet<>();

    @Min(0)
    private long nbTable;

    @Min(0)
    private long nbChair;

    private boolean needElectricity;

    private boolean shared;

    @Size(max = 100)
    private String website;

    @Size(max = 100)
    private String instagram;

    @Size(max = 100)
    private String facebook;

    @Size(max = 500)
    private String urlPicture;
}
