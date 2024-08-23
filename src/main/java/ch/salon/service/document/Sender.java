package ch.salon.service.document;

import ch.salon.domain.Salon;
import java.io.Serializable;

public class Sender implements Serializable {

    private String enterpriseName;
    private String street;
    private String city;
    private String website;

    public Sender(Salon salon) {
        this.enterpriseName = "L'Ajoie de mieux vivre";
        this.street = "Sous les chênes 109A";
        this.city = "2944 Bonfol";
        this.website = "www.lajoiedemieuxvivre-alle.com";
    }

    public String getEnterpriseName() {
        return enterpriseName;
    }

    public void setEnterpriseName(String enterpriseName) {
        this.enterpriseName = enterpriseName;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }
}
