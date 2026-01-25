package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

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

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "formal_line")
    private String formalLine;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "postal_case")
    private String postalCase;

    @Column(name = "address")
    private String address;

    @Column(name = "npa_localite")
    private String npaLocalite;

    @Column(name = "iso_country")
    private String isoCountry;

    @Column(name = "extra_line")
    private String extraLine;
}
