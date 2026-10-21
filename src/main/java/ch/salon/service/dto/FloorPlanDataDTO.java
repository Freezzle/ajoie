package ch.salon.service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Contenu de la colonne {@code data} d'un plan de salle, au format « placement libre ».
 * Toutes les mesures sont en mètres, les angles en degrés horaires.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FloorPlanDataDTO implements Serializable {

    private Double widthMeter;
    private Double heightMeter;
    private List<FloorLocationDTO> locations = new ArrayList<>();
    private List<FloorElementDTO> elements = new ArrayList<>();

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FloorLocationDTO implements Serializable {
        private String id;
        private String idDimension;
        private Double centerX;
        private Double centerY;
        private Double widthMeter;
        private Double depthMeter;
        private Double rotationDeg;
        private Integer position;
        private StandRefDTO stand;
        private PrereservedDTO prereserved;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FloorElementDTO implements Serializable {
        private String id;
        private String type;
        private String label;
        private Double centerX;
        private Double centerY;
        private Double widthMeter;
        private Double depthMeter;
        private Double rotationDeg;
        private Boolean blockingOverride;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StandRefDTO implements Serializable {
        private String id;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PrereservedDTO implements Serializable {
        private String note;
    }
}
