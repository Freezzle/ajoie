package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

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

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "language", nullable = false)
    private String language = Locale.FRENCH.getLanguage();

    @NotNull
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotNull
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "home_address_id")
    private Address homeAddress;

    @Deprecated
    @Transient
    @Column(name = "address")
    private String address;

    @Deprecated
    @Transient
    @Column(name = "npa_localite")
    private String npaLocalite;

    @Deprecated
    @Transient
    @Column(name = "iso_country")
    private String isoCountry = "CH";

    @Column(name = "extra_information")
    private String extraInformation;

    @Column(name = "different_billing_address")
    private Boolean differentBillingAddress = false;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Address billingAddress;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @Column(name = "registration_date")
    private Instant registrationDate;

    @Column(name = "newsletter")
    private boolean newsletter = true;

    @Column(name = "red_flag")
    private boolean redFlag = false;

    @Column(name = "duplicate_detected")
    private boolean duplicateDetected = false;

    public String getFullname() {
        return lastName + " " + firstName;
    }
}
