package ch.salon.service.dto.registration;

import ch.salon.domain.enumeration.Category;
import ch.salon.service.dto.ImageUploadDTO;
import jakarta.validation.Valid;
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
    private String sharedFirstName;

    @Size(max = 100)
    private String sharedLastName;

    @Size(max = 100)
    private String sharedTherapistName;

    @Size(max = 100)
    private String sharedEmail;

    @Size(max = 500)
    private String sharedDescription;

    private Category sharedCategory;

    private Set<String> sharedSubCategories = new LinkedHashSet<>();

    @Size(max = 100)
    private String sharedWebsite;

    @Size(max = 100)
    private String sharedInstagram;

    @Size(max = 100)
    private String sharedFacebook;

    @Size(max = 100)
    private String website;

    @Size(max = 100)
    private String instagram;

    @Size(max = 100)
    private String facebook;

    /**
     * Nouvelle image du stand (base64), facultative.
     */
    @Valid
    private ImageUploadDTO pictureUpload;

    /**
     * Nouvelle image du co-exposant (base64), facultative.
     */
    @Valid
    private ImageUploadDTO sharedPictureUpload;

    /**
     * Indicateurs de lecture seule : une image a déjà été envoyée pour ce stand / ce co-exposant.
     * Aucun aperçu n'est exposé publiquement.
     */
    private boolean hasPicture;

    private boolean hasSharedPicture;
}
