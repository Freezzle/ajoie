package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class ConferenceLightDTO implements Serializable {

    private UUID id;
    private String title;

    public ConferenceLightDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
