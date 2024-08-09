package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class ParticipationLightDTO implements Serializable {

    private UUID id;
    private ExponentLightDTO exponent;

    public ParticipationLightDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public ExponentLightDTO getExponent() {
        return exponent;
    }

    public void setExponent(ExponentLightDTO exponent) {
        this.exponent = exponent;
    }
}
