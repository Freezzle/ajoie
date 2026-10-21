package ch.salon.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * Ancien contenu de la colonne {@code data} d'un plan de salle : une grille de cellules.
 * Ce format n'est plus écrit, il est seulement lu pour être converti par
 * {@link ch.salon.service.FloorPlanMigrator}.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LegacyFloorPlanDataDTO implements Serializable {

    /** Cellules indexées {@code cells[ligne][colonne]}. Absent sur un plan déjà migré. */
    private List<List<LegacyCellDTO>> cells;

    private Double widthMeter;
    private Double heightMeter;

    /** Taille d'une cellule en mètres. Devient la grille par défaut des réglages du salon. */
    private Double spacingMeter;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LegacyCellDTO implements Serializable {
        private String id;
        private boolean firstCell;
        private boolean unusable;
        private LegacyDimensionDTO dimension;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LegacyDimensionDTO implements Serializable {
        private String idDimension;
        private Integer cols;
        private Integer rows;
        private Integer position;
        private FloorPlanDataDTO.StandRefDTO stand;
        private FloorPlanDataDTO.PrereservedDTO prereserved;
    }
}
