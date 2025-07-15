package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class PriceStandDTO implements Serializable {

    private UUID id;
    private Double price;
    private String dimension;
    private Double widthMeter;
    private Double heightMeter;

    public PriceStandDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getDimension() {
        return dimension;
    }

    public void setDimension(String dimension) {
        this.dimension = dimension;
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
}
