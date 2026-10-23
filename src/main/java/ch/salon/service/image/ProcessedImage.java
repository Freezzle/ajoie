package ch.salon.service.image;

/**
 * Résultat d'un traitement d'image : octets ré-encodés, prêts à être persistés.
 *
 * @param data        octets ré-encodés (métadonnées EXIF supprimées)
 * @param contentType type MIME réel ({@code image/jpeg} ou {@code image/png})
 * @param filename    nom de fichier assaini
 * @param width       largeur finale en pixels
 * @param height      hauteur finale en pixels
 * @param checksum    empreinte SHA-256 hexadécimale des octets, utilisable comme ETag
 */
public record ProcessedImage(byte[] data, String contentType, String filename, int width, int height,
                             String checksum) {

    public long size() {
        return data.length;
    }
}
