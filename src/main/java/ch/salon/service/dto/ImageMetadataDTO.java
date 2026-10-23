package ch.salon.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Métadonnées d'une image persistée. Les octets ne transitent jamais par ce DTO : ils sont servis
 * par un endpoint dédié.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageMetadataDTO implements Serializable {

    private String contentType;
    private String filename;
    private Long sizeBytes;
    private Integer width;
    private Integer height;
}
