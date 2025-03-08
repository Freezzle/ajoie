package ch.salon.service.dto;

import java.io.Serializable;
import java.util.UUID;

public class AddressDTO implements Serializable {

    private UUID id;

    private String formalLine;

    private String fullName;

    private String postalCase;

    private String address;

    private String npaLocalite;

    private String extraLine;

    public AddressDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getFormalLine() {
        return formalLine;
    }

    public void setFormalLine(String formalLine) {
        this.formalLine = formalLine;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPostalCase() {
        return postalCase;
    }

    public void setPostalCase(String postalCase) {
        this.postalCase = postalCase;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNpaLocalite() {
        return npaLocalite;
    }

    public void setNpaLocalite(String npaLocalite) {
        this.npaLocalite = npaLocalite;
    }

    public String getExtraLine() {
        return extraLine;
    }

    public void setExtraLine(String extraLine) {
        this.extraLine = extraLine;
    }
}
