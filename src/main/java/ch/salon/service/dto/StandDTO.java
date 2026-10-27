package ch.salon.service.dto;

import ch.salon.domain.enumeration.Category;
import ch.salon.domain.enumeration.Status;
import jakarta.validation.Valid;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
public class StandDTO implements Serializable {

    private UUID id;
    private String description;
    private Boolean publishedOnWebsite = true;
    private String website;
    private String instagram;
    private String facebook;
    private String urlPicture;
    private Boolean shared;
    private Long nbTable;
    private Long nbChair;
    private Boolean needElectricity;
    private String sharedFirstName;
    private String sharedLastName;
    private String sharedTherapistName;
    private String sharedEmail;
    private String sharedDescription;
    private Category sharedCategory;
    private Set<String> sharedSubCategories = new HashSet<>();
    private Boolean sharedPublishedOnWebsite = true;
    private String sharedWebsite;
    private String sharedInstagram;
    private String sharedFacebook;
    private String sharedUrlPicture;
    private Category category;
    private Set<String> subCategories = new HashSet<>();
    private Status status;
    private String extraInformation;
    private Instant registrationDate;
    private ParticipationLightDTO participation;
    private PriceStandLightDTO dimension;

    /**
     * Métadonnées des images uploadées (lecture seule, alimentées par le service).
     */
    private ImageMetadataDTO picture;
    private ImageMetadataDTO sharedPicture;

    /**
     * Nouvelles images à enregistrer (écriture seule).
     */
    @Valid
    private ImageUploadDTO pictureUpload;

    @Valid
    private ImageUploadDTO sharedPictureUpload;

    /**
     * Demande de suppression de l'image existante (écriture seule).
     */
    private boolean removePicture;
    private boolean removeSharedPicture;
}
