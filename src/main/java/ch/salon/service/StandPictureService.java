package ch.salon.service;

import ch.salon.domain.Stand;
import ch.salon.domain.StandPicture;
import ch.salon.domain.enumeration.StandPictureType;
import ch.salon.repository.StandPictureRepository;
import ch.salon.repository.StandPictureRepository.StandPictureMeta;
import ch.salon.service.dto.ImageMetadataDTO;
import ch.salon.service.dto.ImageUploadDTO;
import ch.salon.service.image.ImageProcessingService;
import ch.salon.service.image.ProcessedImage;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Gestion des images rattachées aux stands (image du stand et image du co-exposant).
 * <p>
 * Toute image passe par {@link ImageProcessingService} avant persistance : validation du contenu
 * réel, redimensionnement à 500px de large et ré-encodage.
 */
@Service
@AllArgsConstructor
@Transactional
public class StandPictureService {

    private final StandPictureRepository standPictureRepository;
    private final ImageProcessingService imageProcessingService;

    /**
     * Enregistre (ou remplace) l'image d'un stand.
     */
    public void save(Stand stand, StandPictureType type, ImageUploadDTO upload) {
        byte[] raw = imageProcessingService.decodeBase64(upload.getDataBase64());
        ProcessedImage processed = imageProcessingService.process(raw, upload.getContentType(),
                upload.getFilename());

        StandPicture picture = standPictureRepository.findByStandIdAndType(stand.getId(), type)
                                                     .orElseGet(StandPicture::new);
        picture.setStand(stand);
        picture.setType(type);
        picture.setContentType(processed.contentType());
        picture.setFilename(processed.filename());
        picture.setSizeBytes(processed.size());
        picture.setWidth(processed.width());
        picture.setHeight(processed.height());
        picture.setChecksum(processed.checksum());
        picture.setData(processed.data());
        picture.setUploadedDate(Instant.now());

        standPictureRepository.save(picture);
    }

    public void delete(UUID standId, StandPictureType type) {
        standPictureRepository.deleteByStandIdAndType(standId, type);
    }

    public void deleteAllForStand(UUID standId) {
        standPictureRepository.deleteByStandId(standId);
    }

    @Transactional(readOnly = true)
    public boolean exists(UUID standId, StandPictureType type) {
        return standPictureRepository.existsByStandIdAndType(standId, type);
    }

    /**
     * Métadonnées seules : n'embarque jamais les octets de l'image.
     */
    @Transactional(readOnly = true)
    public Optional<ImageMetadataDTO> getMetadata(UUID standId, StandPictureType type) {
        return standPictureRepository.findMetaByStandIdAndType(standId, type).map(StandPictureService::toMetadata);
    }

    /**
     * Métadonnées de plusieurs stands en une seule requête, indexées par stand puis par type.
     */
    @Transactional(readOnly = true)
    public Map<UUID, Map<StandPictureType, ImageMetadataDTO>> getMetadataByStandIds(Collection<UUID> standIds) {
        if (standIds == null || standIds.isEmpty()) {
            return Map.of();
        }

        return standPictureRepository.findMetaByStandIds(standIds).stream().collect(
                Collectors.groupingBy(StandPictureMeta::getStandId,
                        Collectors.toMap(StandPictureMeta::getType, StandPictureService::toMetadata)));
    }

    private static ImageMetadataDTO toMetadata(StandPictureMeta meta) {
        return new ImageMetadataDTO(meta.getContentType(), meta.getFilename(), meta.getSizeBytes(), meta.getWidth(),
                meta.getHeight());
    }

    /**
     * Image complète, pour l'endpoint de téléchargement uniquement.
     */
    @Transactional(readOnly = true)
    public Optional<StandPicture> getPicture(UUID standId, StandPictureType type) {
        return standPictureRepository.findByStandIdAndType(standId, type);
    }

    /**
     * Applique les demandes d'upload / de suppression portées par un DTO d'écriture.
     */
    public void applyChanges(Stand stand, ImageUploadDTO pictureUpload, boolean removePicture,
                             ImageUploadDTO sharedPictureUpload, boolean removeSharedPicture) {
        applyChange(stand, StandPictureType.MAIN, pictureUpload, removePicture);
        applyChange(stand, StandPictureType.SHARED, sharedPictureUpload, removeSharedPicture);
    }

    private void applyChange(Stand stand, StandPictureType type, ImageUploadDTO upload, boolean remove) {
        if (upload != null) {
            save(stand, type, upload);
        } else if (remove) {
            delete(stand.getId(), type);
        }
    }

    /**
     * Copie détachée d'une image, utilisée pour reporter une image existante sur un stand recréé
     * (modification d'une inscription publique, qui supprime puis recrée les prestations).
     */
    public record StandPictureSnapshot(StandPictureType type, String contentType, String filename, Long sizeBytes,
                                       Integer width, Integer height, String checksum, byte[] data) {
    }

    @Transactional(readOnly = true)
    public Map<StandPictureType, StandPictureSnapshot> snapshot(UUID standId) {
        return standPictureRepository.findByStandId(standId).stream().collect(Collectors.toMap(StandPicture::getType,
                p -> new StandPictureSnapshot(p.getType(), p.getContentType(), p.getFilename(), p.getSizeBytes(),
                        p.getWidth(), p.getHeight(), p.getChecksum(), p.getData())));
    }

    /**
     * Réattache une copie détachée à un nouveau stand.
     */
    public void restore(Stand stand, StandPictureSnapshot snapshot) {
        StandPicture picture = new StandPicture();
        picture.setStand(stand);
        picture.setType(snapshot.type());
        picture.setContentType(snapshot.contentType());
        picture.setFilename(snapshot.filename());
        picture.setSizeBytes(snapshot.sizeBytes());
        picture.setWidth(snapshot.width());
        picture.setHeight(snapshot.height());
        picture.setChecksum(snapshot.checksum());
        picture.setData(snapshot.data());
        picture.setUploadedDate(Instant.now());

        standPictureRepository.save(picture);
    }
}
