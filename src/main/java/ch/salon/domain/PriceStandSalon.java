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
@Table(name = "price_stand_salon")
@Data
public class PriceStandSalon implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

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

    @Column(name="nb_selling_side")
    private Long nbSellingSide;
}
