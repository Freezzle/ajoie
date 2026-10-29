package ch.salon.domain;

import ch.salon.domain.enumeration.VolunteerRegistrationStatus;
import ch.salon.domain.enumeration.ZoneMode;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Inscription publique d'un bénévole à un salon. Les disponibilités alimentent le planning
 * bénévoles via {@code VolunteerPlanningSyncService}. Le bénévole revient la modifier grâce à
 * un lien personnel ({registrationId}/{token}).
 */
@Entity
@Table(name = "volunteer_registration",
       uniqueConstraints = @UniqueConstraint(name = "ux_volunteer_registration_salon_email",
                                             columnNames = {"salon_id", "email"}))
@Data
public class VolunteerRegistration implements Serializable, TenantOwned {

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"priceStandSalons"}, allowSetters = true)
    private Salon salon;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_mode", nullable = false)
    private ZoneMode zoneMode = ZoneMode.ANY;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "category_ids", columnDefinition = "jsonb")
    private List<String> categoryIds = new ArrayList<>();

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "availability", columnDefinition = "jsonb")
    private List<VolunteerAvailabilityDay> availability = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private VolunteerRegistrationStatus status = VolunteerRegistrationStatus.ACTIVE;

    @Column(name = "token", length = 64)
    private String token;

    @Column(name = "planning_volunteer_id")
    private String planningVolunteerId;

    @Column(name = "accepted_contact_at")
    private Instant acceptedContactAt;

    @Column(name = "registration_date")
    private Instant registrationDate;

    @Column(name = "last_modified_date")
    private Instant lastModifiedDate;
}
