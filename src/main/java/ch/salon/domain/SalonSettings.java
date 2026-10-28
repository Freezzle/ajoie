package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.util.UUID;

/**
 * Réglages d'un salon partagés par tous les administrateurs (par exemple le choix des
 * métriques affichées dans le tableau de bord). Il y en a un seul par salon.
 */
@Entity
@Table(name = "salon_settings")
@Data
public class SalonSettings implements Serializable, TenantOwned {

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", nullable = false, columnDefinition = "jsonb")
    private SalonSettingsData data = SalonSettingsData.defaults();

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"priceStandSalons"}, allowSetters = true)
    private Salon salon;
}
