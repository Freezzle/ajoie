package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.UUID;

/**
 * A ConfigurationSalon.
 */
@Entity
@Table(name = "configuration_salon")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ConfigurationSalon implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "price_meal_1")
    private Long priceMeal1;

    @Column(name = "price_meal_2")
    private Long priceMeal2;

    @Column(name = "price_meal_3")
    private Long priceMeal3;

    @Column(name = "price_conference")
    private Long priceConference;

    @Column(name = "price_sharing_stand")
    private Long priceSharingStand;

    @JsonIgnoreProperties(value = { "stands", "conferences", "priceStandSalons", "configuration" }, allowSetters = true)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(unique = true)
    private Salon salon;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public ConfigurationSalon id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Long getPriceMeal1() {
        return this.priceMeal1;
    }

    public ConfigurationSalon priceMeal1(Long priceMeal1) {
        this.setPriceMeal1(priceMeal1);
        return this;
    }

    public void setPriceMeal1(Long priceMeal1) {
        this.priceMeal1 = priceMeal1;
    }

    public Long getPriceMeal2() {
        return this.priceMeal2;
    }

    public ConfigurationSalon priceMeal2(Long priceMeal2) {
        this.setPriceMeal2(priceMeal2);
        return this;
    }

    public void setPriceMeal2(Long priceMeal2) {
        this.priceMeal2 = priceMeal2;
    }

    public Long getPriceMeal3() {
        return this.priceMeal3;
    }

    public ConfigurationSalon priceMeal3(Long priceMeal3) {
        this.setPriceMeal3(priceMeal3);
        return this;
    }

    public void setPriceMeal3(Long priceMeal3) {
        this.priceMeal3 = priceMeal3;
    }

    public Long getPriceConference() {
        return this.priceConference;
    }

    public ConfigurationSalon priceConference(Long priceConference) {
        this.setPriceConference(priceConference);
        return this;
    }

    public void setPriceConference(Long priceConference) {
        this.priceConference = priceConference;
    }

    public Long getPriceSharingStand() {
        return this.priceSharingStand;
    }

    public ConfigurationSalon priceSharingStand(Long priceSharingStand) {
        this.setPriceSharingStand(priceSharingStand);
        return this;
    }

    public void setPriceSharingStand(Long priceSharingStand) {
        this.priceSharingStand = priceSharingStand;
    }

    public Salon getSalon() {
        return this.salon;
    }

    public void setSalon(Salon salon) {
        this.salon = salon;
    }

    public ConfigurationSalon salon(Salon salon) {
        this.setSalon(salon);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ConfigurationSalon)) {
            return false;
        }
        return getId() != null && getId().equals(((ConfigurationSalon) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ConfigurationSalon{" +
            "id=" + getId() +
            ", priceMeal1=" + getPriceMeal1() +
            ", priceMeal2=" + getPriceMeal2() +
            ", priceMeal3=" + getPriceMeal3() +
            ", priceConference=" + getPriceConference() +
            ", priceSharingStand=" + getPriceSharingStand() +
            "}";
    }
}
