package ch.salon.domain;

import ch.salon.domain.enumeration.Category;
import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "stand")
@Data
public class Stand implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "website")
    private String website;

    @Column(name = "instagram")
    private String instagram;

    @Column(name = "facebook")
    private String facebook;

    @Column(name = "url_picture")
    private String urlPicture;

    @Column(name = "shared")
    private Boolean shared;

    @Column(name = "nb_table")
    private Long nbTable;

    @Column(name = "nb_chair")
    private Long nbChair;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private Category category;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sub_categories", columnDefinition = "json")
    private Set<String> subCategories;

    @Column(name = "need_electricity")
    private Boolean needElectricity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"exhibitor", "salon"}, allowSetters = true)
    private Participation participation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "price_stand_salon_id", nullable = true)
    private PriceStandSalon dimension;

    @Column(name = "registration_date")
    private Instant registrationDate;

    public static boolean diffDimension(Stand stand1, Stand stand2) {
        if (stand1 == null && stand2 != null) {
            return true;
        }
        if (stand1 != null && stand2 == null) {
            return true;
        }
        if (stand1 != null && stand2 != null) {
            UUID dim1Id = stand1.getDimension().getId();
            UUID dim2Id = stand2.getDimension().getId();
            return !Objects.equals(dim1Id, dim2Id);
        }
        return false;
    }

    public static boolean diffShared(Stand stand1, Stand stand2) {
        if (stand1 == null && stand2 != null) {
            return true;
        }
        if (stand1 != null && stand2 == null) {
            return true;
        }
        if (stand1 != null && stand2 != null) {
            return !Objects.equals(stand1.getShared(), stand2.getShared());
        }
        return false;
    }

    public static boolean diffStatus(Stand stand1, Stand stand2) {
        if (stand1 == null && stand2 != null) {
            return true;
        }
        if (stand1 != null && stand2 == null) {
            return true;
        }
        if (stand1 != null && stand2 != null) {
            return !Objects.equals(stand1.getStatus(), stand2.getStatus());
        }
        return false;
    }
}
