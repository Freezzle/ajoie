package ch.salon.service;

import ch.salon.service.dto.FloorPlanDataDTO;
import ch.salon.service.dto.LegacyFloorPlanDataDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Convertit les plans de salle stockés à l'ancien format (grille de cellules) vers le nouveau
 * format en mètres (emplacements et éléments).
 * <p>
 * La conversion est faite <b>à la lecture</b> : la base n'est réécrite qu'au premier
 * enregistrement de l'écran, ce qui rend la migration non destructive.
 * <p>
 * Pour une cellule {@code firstCell} portant une dimension, avec {@code s = spacingMeter},
 * {@code row} / {@code col} la position de la cellule et {@code rows} / {@code cols} la taille
 * de la dimension en cellules :
 * <ul>
 *     <li>{@code widthMeter = cols * s}, {@code depthMeter = rows * s} ;</li>
 *     <li>{@code centerX = col * s + widthMeter / 2}, {@code centerY = row * s + depthMeter / 2} ;</li>
 *     <li>{@code rotationDeg = 0} ;</li>
 *     <li>{@code position}, {@code stand} et {@code prereserved} sont repris tels quels.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class FloorPlanMigrator {

    private static final Logger LOGGER = LoggerFactory.getLogger(FloorPlanMigrator.class);

    /** Pas de la grille par défaut quand l'ancien plan n'en déclare pas. */
    private static final double DEFAULT_SPACING_METER = 0.5d;

    private static final double DEFAULT_WIDTH_METER = 20d;
    private static final double DEFAULT_HEIGHT_METER = 10d;

    private final ObjectMapper objectMapper;

    /** Retourne le plan au nouveau format, qu'il soit déjà migré ou non. */
    public FloorPlanDataDTO read(String rawData) {
        LegacyFloorPlanDataDTO legacy = readLegacy(rawData);
        if (legacy != null && legacy.getCells() != null) {
            return migrate(legacy);
        }

        FloorPlanDataDTO data = readCurrent(rawData);
        return data != null ? data : emptyPlan();
    }

    /** Retourne le JSON du plan au nouveau format, prêt à être renvoyé au client. */
    public String toCurrentFormat(String rawData) {
        LegacyFloorPlanDataDTO legacy = readLegacy(rawData);
        if (legacy == null) {
            return write(emptyPlan());
        }
        if (legacy.getCells() == null) {
            // Plan déjà au nouveau format : on ne retouche pas le JSON stocké.
            return rawData;
        }
        return write(migrate(legacy));
    }

    /**
     * Pas de grille déduit d'un ancien plan, utilisé comme valeur par défaut des réglages du
     * salon. Retourne {@code null} si le plan est déjà au nouveau format.
     */
    public Double legacySpacingMeter(String rawData) {
        LegacyFloorPlanDataDTO legacy = readLegacy(rawData);
        if (legacy == null || legacy.getCells() == null) {
            return null;
        }
        return spacingOf(legacy);
    }

    private FloorPlanDataDTO migrate(LegacyFloorPlanDataDTO legacy) {
        double spacing = spacingOf(legacy);

        FloorPlanDataDTO data = new FloorPlanDataDTO();
        data.setWidthMeter(legacy.getWidthMeter() != null ? legacy.getWidthMeter() : DEFAULT_WIDTH_METER);
        data.setHeightMeter(legacy.getHeightMeter() != null ? legacy.getHeightMeter() : DEFAULT_HEIGHT_METER);

        List<FloorPlanDataDTO.FloorLocationDTO> locations = new ArrayList<>();
        List<List<LegacyFloorPlanDataDTO.LegacyCellDTO>> rows = legacy.getCells();

        for (int row = 0; row < rows.size(); row++) {
            List<LegacyFloorPlanDataDTO.LegacyCellDTO> cols = rows.get(row);
            if (cols == null) {
                continue;
            }
            for (int col = 0; col < cols.size(); col++) {
                LegacyFloorPlanDataDTO.LegacyCellDTO cell = cols.get(col);
                if (cell == null || !cell.isFirstCell() || cell.getDimension() == null) {
                    continue;
                }
                locations.add(toLocation(cell, row, col, spacing));
            }
        }

        data.setLocations(locations);
        data.setElements(new ArrayList<>());

        LOGGER.debug("Plan de salle converti : {} emplacement(s) repris", locations.size());
        return data;
    }

    private FloorPlanDataDTO.FloorLocationDTO toLocation(LegacyFloorPlanDataDTO.LegacyCellDTO cell,
                                                         int row, int col, double spacing) {
        LegacyFloorPlanDataDTO.LegacyDimensionDTO dimension = cell.getDimension();

        double widthMeter = (dimension.getCols() != null ? dimension.getCols() : 1) * spacing;
        double depthMeter = (dimension.getRows() != null ? dimension.getRows() : 1) * spacing;

        FloorPlanDataDTO.FloorLocationDTO location = new FloorPlanDataDTO.FloorLocationDTO();
        location.setId(cell.getId() != null && !cell.getId().isBlank()
                ? cell.getId()
                : UUID.randomUUID().toString());
        location.setIdDimension(dimension.getIdDimension());
        location.setWidthMeter(round3(widthMeter));
        location.setDepthMeter(round3(depthMeter));
        location.setCenterX(round3(col * spacing + widthMeter / 2));
        location.setCenterY(round3(row * spacing + depthMeter / 2));
        location.setRotationDeg(0d);
        location.setPosition(dimension.getPosition());
        location.setStand(dimension.getStand());
        location.setPrereserved(dimension.getPrereserved());

        return location;
    }

    private double spacingOf(LegacyFloorPlanDataDTO legacy) {
        Double spacing = legacy.getSpacingMeter();
        return spacing == null || spacing <= 0 ? DEFAULT_SPACING_METER : spacing;
    }

    private LegacyFloorPlanDataDTO readLegacy(String rawData) {
        if (rawData == null || rawData.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(rawData, LegacyFloorPlanDataDTO.class);
        } catch (Exception e) {
            LOGGER.warn("Plan de salle illisible, il sera traité comme vide : {}", e.getMessage());
            return null;
        }
    }

    private FloorPlanDataDTO readCurrent(String rawData) {
        if (rawData == null || rawData.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(rawData, FloorPlanDataDTO.class);
        } catch (Exception e) {
            LOGGER.warn("Plan de salle illisible, il sera traité comme vide : {}", e.getMessage());
            return null;
        }
    }

    private String write(FloorPlanDataDTO data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            LOGGER.warn("Plan de salle non sérialisable : {}", e.getMessage());
            return "{}";
        }
    }

    private FloorPlanDataDTO emptyPlan() {
        FloorPlanDataDTO data = new FloorPlanDataDTO();
        data.setWidthMeter(DEFAULT_WIDTH_METER);
        data.setHeightMeter(DEFAULT_HEIGHT_METER);
        return data;
    }

    private double round3(double value) {
        return Math.round(value * 1000d) / 1000d;
    }
}
