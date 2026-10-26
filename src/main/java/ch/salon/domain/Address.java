package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "address")
@Data
public class Address implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "formal_line")
    private String formalLine;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "postal_case")
    private String postalCase;

    @Column(name = "street", length = 255)
    private String street;

    @Column(name = "house_number", length = 20)
    private String houseNumber;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "city", length = 255)
    private String city;

    @Deprecated
    @Transient
    @Column(name = "address")
    private String address;

    @Deprecated
    @Transient
    @Column(name = "npa_localite")
    private String npaLocalite;

    @Column(name = "iso_country", length = 5)
    private String isoCountry;

    @Column(name = "extra_line")
    private String extraLine;

    /**
     * Découpage d'une ligne d'adresse héritée (import de l'ancien système) : à n'utiliser que
     * pour transformer une chaîne libre en adresse structurée, jamais sur une adresse déjà
     * stockée champ par champ.
     */
    public static String extractStreetName(String fullStreet) {
        if (fullStreet == null || !fullStreet.contains(" ")) return fullStreet;
        return fullStreet.substring(0, fullStreet.lastIndexOf(" "));
    }

    public static String extractHouseNumber(String fullStreet) {
        if (fullStreet == null || !fullStreet.contains(" ")) return null;
        return fullStreet.substring(fullStreet.lastIndexOf(" ") + 1);
    }

    public static String extractPostalCode(String fullCity) {
        if (fullCity == null || !fullCity.contains(" ")) return "";
        return fullCity.split(" ")[0];
    }

    public static String extractCityName(String fullCity) {
        if (fullCity == null) return "";
        String[] parts = fullCity.split(" ", 2);
        return parts.length > 1 ? parts[1] : fullCity;
    }

    /**
     * « Rue 12 ». Renvoie une chaîne vide plutôt qu'une adresse de repli : une adresse
     * incomplète ne doit jamais être remplacée par celle de quelqu'un d'autre.
     */
    public String streetLine() {
        return join(street, houseNumber);
    }

    /** « 2944 Bonfol ». */
    public String cityLine() {
        return join(postalCode, city);
    }

    private static String join(String first, String second) {
        return (StringUtils.trimToEmpty(first) + " " + StringUtils.trimToEmpty(second)).trim();
    }
}
