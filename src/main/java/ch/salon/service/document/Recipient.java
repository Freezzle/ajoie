package ch.salon.service.document;

import ch.salon.domain.Address;
import ch.salon.domain.Exhibitor;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;

import java.io.Serializable;
import java.util.Locale;

@Data
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
            this.street = Address.buildStreet(exhibitor.getBillingAddress());
            this.city = Address.buildCity(exhibitor.getBillingAddress());
            this.country = exhibitor.getBillingAddress().getIsoCountry();
        } else if (exhibitor.getHomeAddress() != null) {
            this.fullName = exhibitor.getFullname();
            this.street = Address.buildStreet(exhibitor.getHomeAddress());
            this.city = Address.buildCity(exhibitor.getHomeAddress());
            this.country = exhibitor.getHomeAddress().getIsoCountry();
        } else {
            this.fullName = exhibitor.getFullname();
            this.street = "";
            this.city = "";
            this.country = "CH";
        }

        this.language =
                StringUtils.isNotBlank(exhibitor.getLanguage()) ? Locale.forLanguageTag(exhibitor.getLanguage()) :
                        Locale.FRENCH;
    }
}
