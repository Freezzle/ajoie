package ch.salon.service.document;

import ch.salon.domain.Exhibitor;
import java.io.Serializable;

public class Recipient implements Serializable {

    private String enterpriseName;
    private String fullName;
    private String street;
    private String city;
    private String country;

    public Recipient(Exhibitor exhibitor) {
        this.enterpriseName = "";
        this.fullName = exhibitor.getFullName();
        this.street = exhibitor.getAddress();
        this.city = exhibitor.getNpaLocalite();
        this.country = ""; // FIXME : COUNTRY ON EXHIBITOR
    }

    public String getEnterpriseName() {
        return enterpriseName;
    }

    public void setEnterpriseName(String enterpriseName) {
        this.enterpriseName = enterpriseName;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }
}
