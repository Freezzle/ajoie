package ch.salon.repository;

import ch.salon.domain.StandPicture;
import ch.salon.domain.enumeration.StandPictureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StandPictureRepository extends JpaRepository<StandPicture, UUID> {

    String META_SELECT = "select p.stand.id as standId, p.type as type, p.contentType as contentType, " +
            "p.filename as filename, p.sizeBytes as sizeBytes, p.width as width, p.height as height, " +
            "p.checksum as checksum from StandPicture p ";

    /**
     * Projection sans les octets : à utiliser partout sauf pour le téléchargement de l'image.
     */
    interface StandPictureMeta {
        UUID getStandId();

        StandPictureType getType();

        String getContentType();

        String getFilename();

        Long getSizeBytes();

        Integer getWidth();

        Integer getHeight();

        String getChecksum();
    }

    @Query(META_SELECT + "where p.stand.id = :standId and p.type = :type")
    Optional<StandPictureMeta> findMetaByStandIdAndType(@Param("standId") UUID standId,
                                                        @Param("type") StandPictureType type);

    /**
     * Chargement groupé des métadonnées pour une liste de stands (évite le N+1).
     */
    @Query(META_SELECT + "where p.stand.id in :standIds")
    List<StandPictureMeta> findMetaByStandIds(@Param("standIds") Collection<UUID> standIds);

    Optional<StandPicture> findByStandIdAndType(UUID standId, StandPictureType type);

    List<StandPicture> findByStandId(UUID standId);

    boolean existsByStandIdAndType(UUID standId, StandPictureType type);

    void deleteByStandIdAndType(UUID standId, StandPictureType type);

    void deleteByStandId(UUID standId);
}
