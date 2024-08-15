package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.UUID;

/**
 * A PriceStandSalon.
 */
@Entity
@Table(name = "price_stand_salon")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PriceStandSalon implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "price", nullable = false)
    private Double price;

    @ManyToOne(fetch = FetchType.EAGER)
    private DimensionStand dimension;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public PriceStandSalon id(UUID id) {
        this.setId(id);
        return this;
    }

    public Double getPrice() {
        return this.price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public PriceStandSalon price(Double price) {
        this.setPrice(price);
        return this;
    }

    public DimensionStand getDimension() {
        return this.dimension;
    }

    public void setDimension(DimensionStand dimensionStand) {
        this.dimension = dimensionStand;
    }

    public PriceStandSalon dimension(DimensionStand dimensionStand) {
        this.setDimension(dimensionStand);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PriceStandSalon)) {
            return false;
        }
        return getId() != null && getId().equals(((PriceStandSalon) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PriceStandSalon{" + "id=" + getId() + ", price=" + getPrice() + "}";
    }
}
