package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class ExponentLightDTO implements Serializable {

    private UUID id;
    private String fullName;

    public ExponentLightDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}
