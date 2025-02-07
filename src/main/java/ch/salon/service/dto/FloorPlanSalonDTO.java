package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class FloorPlanSalonDTO implements Serializable {

    private UUID id;
    private String data;

    public FloorPlanSalonDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
