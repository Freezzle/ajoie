package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class DimensionStandDTO implements Serializable {

    private UUID id;
    private String dimension;

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

    public void setDimension(String dimension) {
        this.dimension = dimension;
    }
}
