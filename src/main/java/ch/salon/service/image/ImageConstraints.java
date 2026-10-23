package ch.salon.service.image;

import java.util.Set;

/**
 * Contraintes communes à tous les uploads d'images de l'application.
 * <p>
 * Ces valeurs sont dupliquées côté front dans {@code app/shared/utils/image-resize.util.ts} :
 * toute modification doit être répercutée des deux côtés.
 */
public final class ImageConstraints {

    /**
     * Taille maximale acceptée pour le fichier d'origine (1 Mo).
     */
    public static final long MAX_BYTES = 1024L * 1024L;

    /**
     * Largeur maximale conservée en base. La hauteur suit le ratio d'origine.
     */
    public static final int MAX_WIDTH = 500;

    /**
     * Garde-fou contre les images « bombe » : nombre total de pixels décodés.
     */
    public static final long MAX_PIXELS = 40_000_000L;

    public static final String MIME_JPEG = "image/jpeg";
    public static final String MIME_PNG = "image/png";

    public static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(MIME_JPEG, MIME_PNG);

    /**
     * Qualité de ré-encodage JPEG.
     */
    public static final float JPEG_QUALITY = 0.85f;

    private ImageConstraints() {
    }
}
