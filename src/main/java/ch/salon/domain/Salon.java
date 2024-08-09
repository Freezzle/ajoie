package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A Salon.
 */
@Entity
@Table(name = "salon")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Salon implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column
    private Long referenceNumber;

    @NotNull
    @Column(name = "place", nullable = false)
    private String place;

    @NotNull
    @Column(name = "starting_date", nullable = false)
    private Instant startingDate;

    @NotNull
    @Column(name = "ending_date", nullable = false)
    private Instant endingDate;

    @Column(name = "price_meal_1")
    private Double priceMeal1;

    @Column(name = "price_meal_2")
    private Double priceMeal2;

    @Column(name = "price_meal_3")
    private Double priceMeal3;

    @Column(name = "price_conference")
    private Double priceConference;

    @Column(name = "price_sharing_stand")
    private Double priceSharingStand;

    @Column(name = "extra_information")
    private String extraInformation;

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL, targetEntity = PriceStandSalon.class)
    @JoinColumn(name = "salon_id", referencedColumnName = "id")
    @JsonIgnoreProperties(value = { "dimension" }, allowSetters = true)
    private Set<PriceStandSalon> priceStandSalons = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Salon id(UUID id) {
        this.setId(id);
        return this;
    }

    public Long getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(Long referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public String getPlace() {
        return this.place;
    }

    public void setPlace(String place) {
        this.place = place;
    }

    public Salon place(String place) {
        this.setPlace(place);
        return this;
    }

    public Instant getStartingDate() {
        return this.startingDate;
    }

    public void setStartingDate(Instant startingDate) {
        this.startingDate = startingDate;
    }

    public Salon startingDate(Instant startingDate) {
        this.setStartingDate(startingDate);
        return this;
    }

    public Instant getEndingDate() {
        return this.endingDate;
    }

    public void setEndingDate(Instant endingDate) {
        this.endingDate = endingDate;
    }

    public Salon endingDate(Instant endingDate) {
        this.setEndingDate(endingDate);
        return this;
    }

    public Double getPriceMeal1() {
        return this.priceMeal1;
    }

    public void setPriceMeal1(Double priceMeal1) {
        this.priceMeal1 = priceMeal1;
    }

    public Salon priceMeal1(Double priceMeal1) {
        this.setPriceMeal1(priceMeal1);
        return this;
    }

    public Double getPriceMeal2() {
        return this.priceMeal2;
    }

    public void setPriceMeal2(Double priceMeal2) {
        this.priceMeal2 = priceMeal2;
    }

    public Salon priceMeal2(Double priceMeal2) {
        this.setPriceMeal2(priceMeal2);
        return this;
    }

    public Double getPriceMeal3() {
        return this.priceMeal3;
    }

    public void setPriceMeal3(Double priceMeal3) {
        this.priceMeal3 = priceMeal3;
    }

    public Salon priceMeal3(Double priceMeal3) {
        this.setPriceMeal3(priceMeal3);
        return this;
    }

    public Double getPriceConference() {
        return this.priceConference;
    }

    public void setPriceConference(Double priceConference) {
        this.priceConference = priceConference;
    }

    public Salon priceConference(Double priceConference) {
        this.setPriceConference(priceConference);
        return this;
    }

    public Double getPriceSharingStand() {
        return this.priceSharingStand;
    }

    public void setPriceSharingStand(Double priceSharingStand) {
        this.priceSharingStand = priceSharingStand;
    }

    public Salon priceSharingStand(Double priceSharingStand) {
        this.setPriceSharingStand(priceSharingStand);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Salon extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public Set<PriceStandSalon> getPriceStandSalons() {
        return this.priceStandSalons;
    }

    public void setPriceStandSalons(Set<PriceStandSalon> priceStandSalons) {
        this.priceStandSalons = priceStandSalons;
    }

    public Salon priceStandSalons(Set<PriceStandSalon> priceStandSalons) {
        this.setPriceStandSalons(priceStandSalons);
        return this;
    }

    public Salon addPriceStandSalon(PriceStandSalon priceStandSalon) {
        this.priceStandSalons.add(priceStandSalon);
        return this;
    }

    public Salon removePriceStandSalon(PriceStandSalon priceStandSalon) {
        this.priceStandSalons.remove(priceStandSalon);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Salon)) {
            return false;
        }
        return getId() != null && getId().equals(((Salon) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Salon{" +
               "id=" + getId() +
               ", referenceNumber='" + getReferenceNumber() + "'" +
               ", place='" + getPlace() + "'" +
               ", startingDate='" + getStartingDate() + "'" +
               ", endingDate='" + getEndingDate() + "'" +
               ", priceMeal1=" + getPriceMeal1() +
               ", priceMeal2=" + getPriceMeal2() +
               ", priceMeal3=" + getPriceMeal3() +
               ", priceConference=" + getPriceConference() +
               ", priceSharingStand=" + getPriceSharingStand() +
               ", extraInformation='" + getExtraInformation() + "'" +
               "}";
    }
}
