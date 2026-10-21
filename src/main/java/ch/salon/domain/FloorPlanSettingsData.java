package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Contenu JSON des réglages du plan de la salle. Les tailles sont en mètres et les angles en
 * degrés.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FloorPlanSettingsData implements Serializable {

    /** Pas de la grille affichée : 0.25, 0.5 ou 1 m. */
    private Double gridMeter;

    /** Pas de déplacement : 0.05, 0.1, 0.25, 0.5 ou 1 m. */
    private Double moveStepMeter;

    /** Pas de rotation : 1, 5, 15 ou 45°. */
    private Integer rotationStepDeg;

    /** Aimantation aux bords voisins. */
    private Boolean magnet;

    /** Taille et comportement par défaut de chaque type d'élément. */
    private Map<String, ElementTypeSetting> elementTypes = new LinkedHashMap<>();

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ElementTypeSetting implements Serializable {
        private Double widthMeter;
        private Double depthMeter;
        private Boolean blocking;

        public static ElementTypeSetting of(double widthMeter, double depthMeter, boolean blocking) {
            ElementTypeSetting setting = new ElementTypeSetting();
            setting.setWidthMeter(widthMeter);
            setting.setDepthMeter(depthMeter);
            setting.setBlocking(blocking);
            return setting;
        }
    }

    public static FloorPlanSettingsData defaults() {
        FloorPlanSettingsData data = new FloorPlanSettingsData();
        data.setGridMeter(0.5d);
        data.setMoveStepMeter(0.25d);
        data.setRotationStepDeg(15);
        data.setMagnet(true);

        Map<String, ElementTypeSetting> types = new LinkedHashMap<>();
        types.put("AISLE", ElementTypeSetting.of(10d, 2d, true));
        types.put("DOOR", ElementTypeSetting.of(5d, 2.5d, true));
        types.put("EXIT", ElementTypeSetting.of(1.5d, 2.5d, true));
        types.put("STAIRS", ElementTypeSetting.of(1.4d, 3.2d, true));
        types.put("ELEVATOR", ElementTypeSetting.of(1.8d, 1.8d, true));
        types.put("STAGE", ElementTypeSetting.of(6d, 4d, true));
        types.put("BAR", ElementTypeSetting.of(5d, 4d, true));
        types.put("WC", ElementTypeSetting.of(2.5d, 1.6d, true));
        types.put("TECH", ElementTypeSetting.of(2d, 2d, true));
        types.put("POWER", ElementTypeSetting.of(0.4d, 0.4d, false));
        types.put("MARK", ElementTypeSetting.of(3d, 2d, false));
        types.put("WALL", ElementTypeSetting.of(4d, 0.2d, true));
        types.put("PILLAR", ElementTypeSetting.of(0.5d, 0.5d, true));
        data.setElementTypes(types);

        return data;
    }
}
