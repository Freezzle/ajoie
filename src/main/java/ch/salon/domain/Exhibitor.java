package ch.salon.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "exhibitor")
@Data
public class Exhibitor implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "language", nullable = false)
    private String language = Locale.FRENCH.getLanguage();

    @NotNull
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "address")
    private String address;

    @Column(name = "npa_localite")
    private String npaLocalite;

    @Column(name = "iso_country")
    private String isoCountry = "CH";

    @Column(name = "extra_information")
    private String extraInformation;

    @Column(name = "different_billing_address")
    private Boolean differentBillingAddress = false;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Address billingAddress;

    @Column(name = "registration_date")
    private Instant registrationDate;

    @Column(name = "newsletter")
    private boolean newsletter = true;

    @Column(name = "red_flag")
    private boolean redFlag = false;

    @Column(name = "duplicate_detected")
    private boolean duplicateDetected = false;
}
