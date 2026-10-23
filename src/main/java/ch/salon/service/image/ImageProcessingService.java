package ch.salon.service.image;

import ch.salon.web.rest.errors.BadRequestAlertException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.Locale;

/**
 * Traitement centralisé et sécurisé des images uploadées par les utilisateurs.
 * <p>
 * Le service fait autorité : peu importe ce que fait le navigateur, toute image passe ici avant
 * d'être persistée. Il valide le contenu réel (magic bytes), se protège des images « bombe »,
 * redimensionne à {@link ImageConstraints#MAX_WIDTH} de large et ré-encode l'image, ce qui a pour
 * effet de supprimer toutes les métadonnées (EXIF, GPS, profils, charges utiles cachées).
 * <p>
 * Réutilisable pour n'importe quelle entité : il ne connaît rien du domaine.
 */
@Service
public class ImageProcessingService {

    public static final String ENTITY_NAME = "image";

    private static final Logger log = LoggerFactory.getLogger(ImageProcessingService.class);

    private static final byte[] MAGIC_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] MAGIC_PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private static final String DEFAULT_FILENAME = "image";
    private static final int MAX_FILENAME_LENGTH = 100;

    static {
        // Évite l'écriture de fichiers temporaires sur le disque lors des lectures/écritures ImageIO.
        ImageIO.setUseCache(false);
    }

    /**
     * Décode une charge utile base64 (avec ou sans préfixe {@code data:image/png;base64,}).
     *
     * @throws BadRequestAlertException si la chaîne n'est pas un base64 valide
     */
    public byte[] decodeBase64(String base64) {
        if (StringUtils.isBlank(base64)) {
            throw new BadRequestAlertException("Image vide", ENTITY_NAME, "image.empty");
        }

        String payload = StringUtils.substringAfter(base64, "base64,");
        if (StringUtils.isBlank(payload)) {
            payload = base64;
        }

        try {
            return Base64.getDecoder().decode(payload.replaceAll("\\s", ""));
        } catch (IllegalArgumentException e) {
            throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
        }
    }

    /**
     * Valide, redimensionne et ré-encode une image.
     *
     * @param raw                 octets d'origine
     * @param declaredContentType type MIME annoncé par le client (purement indicatif)
     * @param filename            nom de fichier d'origine (assaini)
     */
    public ProcessedImage process(byte[] raw, String declaredContentType, String filename) {
        if (raw == null || raw.length == 0) {
            throw new BadRequestAlertException("Image vide", ENTITY_NAME, "image.empty");
        }

        if (raw.length > ImageConstraints.MAX_BYTES) {
            throw new BadRequestAlertException("Image trop volumineuse", ENTITY_NAME, "image.too-large");
        }

        String contentType = detectContentType(raw);
        if (declaredContentType != null && !contentType.equalsIgnoreCase(StringUtils.substringBefore(
                declaredContentType, ";").trim())) {
            log.debug("Type MIME déclaré ({}) différent du contenu réel ({}), le contenu réel fait foi",
                    declaredContentType, contentType);
        }

        BufferedImage source = read(raw);
        BufferedImage resized = resize(source, contentType);
        byte[] encoded = encode(resized, contentType);

        return new ProcessedImage(encoded, contentType, sanitizeFilename(filename, contentType), resized.getWidth(),
                resized.getHeight(), checksum(encoded));
    }

    /**
     * Détecte le format réel à partir des premiers octets ; le {@code Content-Type} déclaré par le
     * client n'est jamais digne de confiance.
     */
    private String detectContentType(byte[] raw) {
        if (startsWith(raw, MAGIC_JPEG)) {
            return ImageConstraints.MIME_JPEG;
        }
        if (startsWith(raw, MAGIC_PNG)) {
            return ImageConstraints.MIME_PNG;
        }
        throw new BadRequestAlertException("Seules les images JPEG et PNG sont acceptées", ENTITY_NAME,
                "image.invalid-type");
    }

    private boolean startsWith(byte[] raw, byte[] magic) {
        if (raw.length < magic.length) {
            return false;
        }
        for (int i = 0; i < magic.length; i++) {
            if (raw[i] != magic[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Lit l'image après avoir vérifié ses dimensions annoncées, afin de ne jamais décoder une image
     * dont la taille décompressée ferait exploser la mémoire.
     */
    private BufferedImage read(byte[] raw) {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(raw))) {
            if (input == null) {
                throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);

                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
                if (pixels > ImageConstraints.MAX_PIXELS) {
                    throw new BadRequestAlertException("Image trop grande", ENTITY_NAME, "image.too-many-pixels");
                }

                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (IOException | ArrayIndexOutOfBoundsException | IllegalArgumentException e) {
            throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
        }
    }

    /**
     * Réduit l'image à {@link ImageConstraints#MAX_WIDTH} de large en conservant le ratio. Les images
     * déjà plus petites sont seulement reprojetées (ce qui garantit un ré-encodage propre).
     */
    private BufferedImage resize(BufferedImage source, String contentType) {
        int targetWidth = Math.min(source.getWidth(), ImageConstraints.MAX_WIDTH);
        int targetHeight = Math.max(1,
                Math.round(source.getHeight() * (targetWidth / (float) source.getWidth())));

        boolean keepAlpha = ImageConstraints.MIME_PNG.equals(contentType);
        BufferedImage target = new BufferedImage(targetWidth, targetHeight,
                keepAlpha ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);

        Graphics2D graphics = target.createGraphics();
        try {
            if (!keepAlpha) {
                // Le JPEG ne gère pas la transparence : on aplatit sur un fond blanc.
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, targetWidth, targetHeight);
            }
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                    RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }

        return target;
    }

    private byte[] encode(BufferedImage image, String contentType) {
        String formatName = ImageConstraints.MIME_PNG.equals(contentType) ? "png" : "jpg";

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName(formatName);
            if (!writers.hasNext()) {
                throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
            }

            ImageWriter writer = writers.next();
            try (ImageOutputStream output = ImageIO.createImageOutputStream(out)) {
                writer.setOutput(output);

                ImageWriteParam params = writer.getDefaultWriteParam();
                if (!ImageConstraints.MIME_PNG.equals(contentType) && params.canWriteCompressed()) {
                    params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    params.setCompressionQuality(ImageConstraints.JPEG_QUALITY);
                }

                // On n'écrit que les données de l'image : aucune métadonnée d'origine n'est reprise.
                writer.write(null, new IIOImage(image, null, null), params);
            } finally {
                writer.dispose();
            }

            return out.toByteArray();
        } catch (IOException e) {
            throw new BadRequestAlertException("Image illisible", ENTITY_NAME, "image.invalid-content");
        }
    }

    private String checksum(byte[] data) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    /**
     * Neutralise le nom de fichier fourni par le client (traversée de répertoire, caractères
     * exotiques) et force une extension cohérente avec le format réel.
     */
    private String sanitizeFilename(String filename, String contentType) {
        String extension = ImageConstraints.MIME_PNG.equals(contentType) ? ".png" : ".jpg";

        String base = StringUtils.defaultIfBlank(filename, DEFAULT_FILENAME);
        base = base.substring(Math.max(base.lastIndexOf('/'), base.lastIndexOf('\\')) + 1);
        base = StringUtils.defaultIfBlank(StringUtils.substringBeforeLast(base, "."), base);
        base = base.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "-").replaceAll("-{2,}", "-");
        base = StringUtils.strip(base, "-._");

        if (StringUtils.isBlank(base)) {
            base = DEFAULT_FILENAME;
        }
        if (base.length() > MAX_FILENAME_LENGTH) {
            base = base.substring(0, MAX_FILENAME_LENGTH);
        }

        return base + extension;
    }
}
