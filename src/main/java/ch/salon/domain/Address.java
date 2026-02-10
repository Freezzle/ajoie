package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
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

    public static String buildStreet(Address address) {
        if (address.getStreet() != null && address.getHouseNumber() != null) {
            return address.getStreet() + " " + address.getHouseNumber();
        } else if (address.getStreet() != null) {
            return address.getStreet();
        }
        return "Sous les chênes 109A";
    }

    public static String buildCity(Address address) {
        if (address.getPostalCode() != null && address.getCity() != null) {
            return address.getPostalCode() + " " + address.getCity();
        } else if (address.getCity() != null) {
            return address.getCity();
        }
        return "2944 Bonfol";
    }
}
