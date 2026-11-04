package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.util.Comparator;
import java.util.UUID;

@Entity
@Table(name = "price_stand_salon")
@Data
public class PriceStandSalon implements Serializable, TenantOwned {
    public static final Comparator<PriceStandSalon> DISPLAY_ORDER = Comparator
            .comparing(PriceStandSalon::getSortOrder, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
            .thenComparing(PriceStandSalon::getDimension, Comparator.nullsLast(String::compareToIgnoreCase));

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "price", nullable = false)
    private Double price;

    @NotNull
    @Column(name = "dimension", nullable = false)
    private String dimension;

    @NotNull
    @Column(name = "width_meter", nullable = false)
    private Double widthMeter;

    @NotNull
    @Column(name = "height_meter", nullable = false)
    private Double heightMeter;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name="nb_selling_side")
    private Long nbSellingSide;
}
