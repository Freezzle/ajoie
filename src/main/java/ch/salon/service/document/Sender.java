package ch.salon.service.document;

import ch.salon.domain.Address;
import ch.salon.domain.Salon;
import lombok.Data;

import java.io.Serializable;

@Data
public class Sender implements Serializable {

    private String enterpriseName;
    private String street;
    private String city;
    private String website;

    public Sender(Salon salon) {
        this.enterpriseName = "L'Ajoie de mieux vivre";
        this.website = "www.lajoiedemieuxvivre-alle.com";

        if (salon.getHeadquartersAddress() != null) {
            Address address = salon.getHeadquartersAddress();
            this.street = Address.buildStreet(address);
            this.city = Address.buildCity(address);
        } else {
            // Fallback to hardcoded values
            this.street = "Sous les chênes 109A";
            this.city = "2944 Bonfol";
        }
    }
}
