package ch.salon.domain;

import ch.salon.domain.enumeration.StandPictureType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Image (JPEG/PNG) rattachée à un stand, déjà redimensionnée et ré-encodée par
 * {@code ImageProcessingService} avant persistance.
 * <p>
 * Les octets ne doivent jamais être chargés implicitement : les listes passent par la projection
 * {@code StandPictureMeta} et seule la lecture dédiée récupère {@code data}.
 */
@Entity
@Table(name = "stand_picture", uniqueConstraints = @UniqueConstraint(name = "ux_stand_picture__stand_type", columnNames = {"stand_id", "type"}))
@Data
public class StandPicture implements Serializable, TenantOwned {

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stand_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Stand stand;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private StandPictureType type;

    @NotNull
    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(name = "filename", length = 255)
    private String filename;

    @NotNull
    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @NotNull
    @Column(name = "width", nullable = false)
    private Integer width;

    @NotNull
    @Column(name = "height", nullable = false)
    private Integer height;

    /**
     * Empreinte SHA-256 du contenu, utilisée comme ETag.
     */
    @NotNull
    @Column(name = "checksum", nullable = false, length = 64)
    private String checksum;

    @NotNull
    @Column(name = "data", nullable = false, columnDefinition = "bytea")
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private byte[] data;

    @Column(name = "uploaded_date")
    private Instant uploadedDate;
}
