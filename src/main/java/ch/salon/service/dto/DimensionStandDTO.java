package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class DimensionStandDTO implements Serializable {

    private UUID id;
    private String dimension;
    private Double widthMeter;
    private Double heightMeter;

    public DimensionStandDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getDimension() {
        return dimension;
    }

    public Double getWidthMeter() {
        return widthMeter;
    }

    public void setWidthMeter(Double widthMeter) {
        this.widthMeter = widthMeter;
    }

    public Double getHeightMeter() {
        return heightMeter;
    }

    public void setHeightMeter(Double heightMeter) {
        this.heightMeter = heightMeter;
    }

    public void setDimension(String dimension) {
        this.dimension = dimension;
    }
}
