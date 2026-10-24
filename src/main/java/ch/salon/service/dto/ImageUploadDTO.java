package ch.salon.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Image envoyée par le client, encodée en base64.
 * <p>
 * Le contenu est systématiquement re-validé et ré-encodé côté serveur
 * ({@code ImageProcessingService}) : les valeurs déclarées ici ne sont qu'indicatives.
 */
@Data
public class ImageUploadDTO implements Serializable {

    /**
     * Borne large volontairement : la limite réelle sur les octets décodés
     * ({@link ch.salon.service.image.ImageConstraints#MAX_BYTES}) est appliquée par
     * {@code ImageProcessingService}. Les images sont déjà réduites à 500 px de large par le
     * navigateur avant l'envoi : le payload transmis reste très en dessous de cette borne.
     * Le base64 ajoute environ 33 % de volume.
     */
    public static final int MAX_BASE64_LENGTH = 1_600_000;

    @Size(max = 255)
    private String filename;

    @Size(max = 100)
    private String contentType;

    @NotBlank
    @Size(max = MAX_BASE64_LENGTH)
    private String dataBase64;
}
