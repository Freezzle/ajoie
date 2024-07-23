package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A DimensionStand.
 */
@Entity
@Table(name = "dimension_stand")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class DimensionStand implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "dimension")
    private String dimension;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "dimension")
    @JsonIgnoreProperties(value = { "dimension", "salon" }, allowSetters = true)
    private Set<PriceStandSalon> priceStandSalons = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "dimension")
    @JsonIgnoreProperties(value = { "billing", "exponent", "salon", "dimension" }, allowSetters = true)
    private Set<Stand> stands = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public DimensionStand id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getDimension() {
        return this.dimension;
    }

    public DimensionStand dimension(String dimension) {
        this.setDimension(dimension);
        return this;
    }

    public void setDimension(String dimension) {
        this.dimension = dimension;
    }

    public Set<PriceStandSalon> getPriceStandSalons() {
        return this.priceStandSalons;
    }

    public void setPriceStandSalons(Set<PriceStandSalon> priceStandSalons) {
        if (this.priceStandSalons != null) {
            this.priceStandSalons.forEach(i -> i.setDimension(null));
        }
        if (priceStandSalons != null) {
            priceStandSalons.forEach(i -> i.setDimension(this));
        }
        this.priceStandSalons = priceStandSalons;
    }

    public DimensionStand priceStandSalons(Set<PriceStandSalon> priceStandSalons) {
        this.setPriceStandSalons(priceStandSalons);
        return this;
    }

    public DimensionStand addPriceStandSalon(PriceStandSalon priceStandSalon) {
        this.priceStandSalons.add(priceStandSalon);
        priceStandSalon.setDimension(this);
        return this;
    }

    public DimensionStand removePriceStandSalon(PriceStandSalon priceStandSalon) {
        this.priceStandSalons.remove(priceStandSalon);
        priceStandSalon.setDimension(null);
        return this;
    }

    public Set<Stand> getStands() {
        return this.stands;
    }

    public void setStands(Set<Stand> stands) {
        if (this.stands != null) {
            this.stands.forEach(i -> i.setDimension(null));
        }
        if (stands != null) {
            stands.forEach(i -> i.setDimension(this));
        }
        this.stands = stands;
    }

    public DimensionStand stands(Set<Stand> stands) {
        this.setStands(stands);
        return this;
    }

    public DimensionStand addStand(Stand stand) {
        this.stands.add(stand);
        stand.setDimension(this);
        return this;
    }

    public DimensionStand removeStand(Stand stand) {
        this.stands.remove(stand);
        stand.setDimension(null);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

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

    // prettier-ignore
    @Override
    public String toString() {
        return "DimensionStand{" +
            "id=" + getId() +
            ", dimension='" + getDimension() + "'" +
            "}";
    }
}
