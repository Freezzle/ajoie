package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "salon_volunteer_planning")
@Data
public class PlanningVolunteerSalon implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "configuration", nullable = false, columnDefinition = "jsonb")
    private VolunteerPlanningConfiguration configuration;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "volunteers", nullable = false, columnDefinition = "jsonb")
    private List<VolunteerPlanningData> volunteers = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"priceStandSalons"}, allowSetters = true)
    private Salon salon;
}
