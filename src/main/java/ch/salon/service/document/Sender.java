package ch.salon.service.document;

import ch.salon.domain.Address;
import ch.salon.domain.Salon;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;

import java.io.Serializable;

/**
 * Expéditeur d'un document : le siège du salon, ou l'adresse de l'association à défaut.
 */
@Data
public class Sender implements Serializable, PostalParty {

    private String enterpriseName;
    private String fullName;
    private String postalCase;
    private String extraLine;
    private String street;
    private String houseNumber;
    private String postalCode;
    private String city;
    private String country;
    private String website;

    public Sender(Salon salon) {
        this.enterpriseName = "L'Ajoie de mieux vivre";
        this.website = "www.lajoiedemieuxvivre-alle.com";

        Address address = salon.getHeadquartersAddress();

        if (address != null && StringUtils.isNotBlank(address.getStreet())) {
            this.postalCase = address.getPostalCase();
            this.extraLine = address.getExtraLine();
            this.street = address.getStreet();
            this.houseNumber = address.getHouseNumber();
            this.postalCode = address.getPostalCode();
            this.city = address.getCity();
            this.country = StringUtils.defaultIfBlank(address.getIsoCountry(), "CH");
        } else {
            this.street = "Sous les chênes";
            this.houseNumber = "109A";
            this.postalCode = "2944";
            this.city = "Bonfol";
            this.country = "CH";
        }
    }
}
