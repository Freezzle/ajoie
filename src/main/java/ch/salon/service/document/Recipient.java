package ch.salon.service.document;

import ch.salon.domain.Exhibitor;
import org.apache.commons.lang3.StringUtils;

import java.io.Serializable;
import java.util.Locale;

public class Recipient implements Serializable {

    private String enterpriseName;
    private String fullName;
    private String street;
    private String city;
    private String country;
    private Locale language;

    public Recipient(Exhibitor exhibitor) {

        if (exhibitor.getDifferentBillingAddress() && exhibitor.getBillingAddress() != null) {
            this.enterpriseName = exhibitor.getBillingAddress().getFormalLine();
            this.fullName = exhibitor.getBillingAddress().getFullName();
            this.street = exhibitor.getBillingAddress().getAddress();
            this.city = exhibitor.getBillingAddress().getNpaLocalite();
            this.country = ""; // FIXME : COUNTRY ON EXHIBITOR
        } else {
            this.fullName = exhibitor.getFullName();
            this.street = exhibitor.getAddress();
            this.city = exhibitor.getNpaLocalite();
            this.country = ""; // FIXME : COUNTRY ON EXHIBITOR
        }

        this.language =
                StringUtils.isNotBlank(exhibitor.getLanguage()) ? Locale.forLanguageTag(exhibitor.getLanguage()) :
                        Locale.FRENCH;
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

    public Locale getLanguage() {
        return language;
    }

    public void setLanguage(Locale language) {
        this.language = language;
    }
}
