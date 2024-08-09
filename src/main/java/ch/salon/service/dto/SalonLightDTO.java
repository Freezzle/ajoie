package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class SalonLightDTO implements Serializable {

    private UUID id;

    private String place;

    public SalonLightDTO() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPlace() {
        return place;
    }

    public void setPlace(String place) {
        this.place = place;
    }
}
