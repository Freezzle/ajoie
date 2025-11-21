package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class AddressDTO implements Serializable {

    private UUID id;
    private String formalLine;
    private String fullName;
    private String postalCase;
    private String address;
    private String npaLocalite;
    private String isoCountry;
    private String extraLine;
}
