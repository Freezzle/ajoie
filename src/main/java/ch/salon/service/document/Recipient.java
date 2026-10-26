package ch.salon.service.document;

import ch.salon.domain.Address;
import ch.salon.domain.Exhibitor;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;

import java.io.Serializable;
import java.util.Locale;

/**
 * Destinataire d'un document : l'adresse de facturation de l'exposant quand il en a déclaré
 * une, sinon son adresse de domicile. Les champs restent structurés pour alimenter aussi bien
 * l'en-tête du document que le QR-facture.
 */
@Data
public class Recipient implements Serializable, PostalParty {

    private String enterpriseName;
    private String fullName;
    private String postalCase;
    private String extraLine;
    private String street;
    private String houseNumber;
    private String postalCode;
    private String city;
    private String country;
    private Locale language;

    public Recipient(Exhibitor exhibitor) {
        Address address = addressOf(exhibitor);

        if (address != null) {
            this.enterpriseName = address.getFormalLine();
            this.fullName = StringUtils.defaultIfBlank(address.getFullName(), exhibitor.getFullname());
            this.postalCase = address.getPostalCase();
            this.extraLine = address.getExtraLine();
            this.street = address.getStreet();
            this.houseNumber = address.getHouseNumber();
            this.postalCode = address.getPostalCode();
            this.city = address.getCity();
            this.country = StringUtils.defaultIfBlank(address.getIsoCountry(), "CH");
        } else {
            this.fullName = exhibitor.getFullname();
            this.country = "CH";
        }

        this.language = StringUtils.isNotBlank(exhibitor.getLanguage())
                ? Locale.forLanguageTag(exhibitor.getLanguage())
                : Locale.FRENCH;
    }

    private static Address addressOf(Exhibitor exhibitor) {
        if (Boolean.TRUE.equals(exhibitor.getDifferentBillingAddress()) && exhibitor.getBillingAddress() != null) {
            return exhibitor.getBillingAddress();
        }

        return exhibitor.getHomeAddress();
    }
}
