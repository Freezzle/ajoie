package ch.salon.service.document;

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
            this.street = exhibitor.getBillingAddress().getAddress();
            this.city = exhibitor.getBillingAddress().getNpaLocalite();
            this.country = exhibitor.getBillingAddress().getIsoCountry();
        } else {
            this.fullName = exhibitor.getFullName();
            this.street = exhibitor.getAddress();
            this.city = exhibitor.getNpaLocalite();
            this.country = exhibitor.getIsoCountry();
        }

        this.language =
                StringUtils.isNotBlank(exhibitor.getLanguage()) ? Locale.forLanguageTag(exhibitor.getLanguage()) :
                        Locale.FRENCH;
    }
}
