package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class PriceStandLightDTO implements Serializable {

    private UUID id;
    private Double price;
    private DimensionStandLightDTO dimension;

    public PriceStandLightDTO() {
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

    public DimensionStandLightDTO getDimension() {
        return dimension;
    }

    public void setDimension(DimensionStandLightDTO dimension) {
        this.dimension = dimension;
    }
}
