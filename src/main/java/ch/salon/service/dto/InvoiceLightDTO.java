package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class InvoiceLightDTO implements Serializable {

    private UUID id;

    public InvoiceLightDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }
}
