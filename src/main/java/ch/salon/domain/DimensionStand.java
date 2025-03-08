package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "dimension_stand")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class DimensionStand implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "dimension",
            nullable = false)
    private String dimension;

    @NotNull
    @Column(name = "width_meter",
            nullable = false)
    private Double widthMeter;

    @NotNull
    @Column(name = "height_meter",
            nullable = false)
    private Double heightMeter;

    public DimensionStand() {
    }

    public DimensionStand(String dimension, Double widthMeter, Double heightMeter) {
        this.dimension = dimension;
        this.widthMeter = widthMeter;
        this.heightMeter = heightMeter;
    }

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public DimensionStand id(UUID id) {
        this.setId(id);
        return this;
    }

    public String getDimension() {
        return this.dimension;
    }

    public void setDimension(String dimension) {
        this.dimension = dimension;
    }

    public DimensionStand dimension(String dimension) {
        this.setDimension(dimension);
        return this;
    }

    public @NotNull Double getWidthMeter() {
        return widthMeter;
    }

    public void setWidthMeter(@NotNull Double widthMeter) {
        this.widthMeter = widthMeter;
    }

    public @NotNull Double getHeightMeter() {
        return heightMeter;
    }

    public void setHeightMeter(@NotNull Double heightMeter) {
        this.heightMeter = heightMeter;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DimensionStand)) {
            return false;
        }
        return getId() != null && getId().equals(((DimensionStand) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "DimensionStand{" + "id=" + getId() + ", dimension='" + getDimension() + "'" + "}";
    }
}
