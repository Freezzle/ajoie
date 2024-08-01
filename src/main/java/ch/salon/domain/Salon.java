package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
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
    private Long priceMeal1;

    @Column(name = "price_meal_2")
    private Long priceMeal2;

    @Column(name = "price_meal_3")
    private Long priceMeal3;

    @Column(name = "price_conference")
    private Long priceConference;

    @Column(name = "price_sharing_stand")
    private Long priceSharingStand;

    @Column(name = "extra_information")
    private String extraInformation;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "salon")
    @JsonIgnoreProperties(value = { "conferences", "payments", "invoices", "stands", "exponent", "salon" }, allowSetters = true)
    private Set<Participation> participations = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "salon")
    @JsonIgnoreProperties(value = { "salon", "dimension" }, allowSetters = true)
    private Set<PriceStandSalon> priceStandSalons = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Salon id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPlace() {
        return this.place;
    }

    public Salon place(String place) {
        this.setPlace(place);
        return this;
    }

    public void setPlace(String place) {
        this.place = place;
    }

    public Instant getStartingDate() {
        return this.startingDate;
    }

    public Salon startingDate(Instant startingDate) {
        this.setStartingDate(startingDate);
        return this;
    }

    public void setStartingDate(Instant startingDate) {
        this.startingDate = startingDate;
    }

    public Instant getEndingDate() {
        return this.endingDate;
    }

    public Salon endingDate(Instant endingDate) {
        this.setEndingDate(endingDate);
        return this;
    }

    public void setEndingDate(Instant endingDate) {
        this.endingDate = endingDate;
    }

    public Long getPriceMeal1() {
        return this.priceMeal1;
    }

    public Salon priceMeal1(Long priceMeal1) {
        this.setPriceMeal1(priceMeal1);
        return this;
    }

    public void setPriceMeal1(Long priceMeal1) {
        this.priceMeal1 = priceMeal1;
    }

    public Long getPriceMeal2() {
        return this.priceMeal2;
    }

    public Salon priceMeal2(Long priceMeal2) {
        this.setPriceMeal2(priceMeal2);
        return this;
    }

    public void setPriceMeal2(Long priceMeal2) {
        this.priceMeal2 = priceMeal2;
    }

    public Long getPriceMeal3() {
        return this.priceMeal3;
    }

    public Salon priceMeal3(Long priceMeal3) {
        this.setPriceMeal3(priceMeal3);
        return this;
    }

    public void setPriceMeal3(Long priceMeal3) {
        this.priceMeal3 = priceMeal3;
    }

    public Long getPriceConference() {
        return this.priceConference;
    }

    public Salon priceConference(Long priceConference) {
        this.setPriceConference(priceConference);
        return this;
    }

    public void setPriceConference(Long priceConference) {
        this.priceConference = priceConference;
    }

    public Long getPriceSharingStand() {
        return this.priceSharingStand;
    }

    public Salon priceSharingStand(Long priceSharingStand) {
        this.setPriceSharingStand(priceSharingStand);
        return this;
    }

    public void setPriceSharingStand(Long priceSharingStand) {
        this.priceSharingStand = priceSharingStand;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public Salon extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Set<Participation> getParticipations() {
        return this.participations;
    }

    public void setParticipations(Set<Participation> participations) {
        if (this.participations != null) {
            this.participations.forEach(i -> i.setSalon(null));
        }
        if (participations != null) {
            participations.forEach(i -> i.setSalon(this));
        }
        this.participations = participations;
    }

    public Salon participations(Set<Participation> participations) {
        this.setParticipations(participations);
        return this;
    }

    public Salon addParticipation(Participation participation) {
        this.participations.add(participation);
        participation.setSalon(this);
        return this;
    }

    public Salon removeParticipation(Participation participation) {
        this.participations.remove(participation);
        participation.setSalon(null);
        return this;
    }

    public Set<PriceStandSalon> getPriceStandSalons() {
        return this.priceStandSalons;
    }

    public void setPriceStandSalons(Set<PriceStandSalon> priceStandSalons) {
        if (this.priceStandSalons != null) {
            this.priceStandSalons.forEach(i -> i.setSalon(null));
        }
        if (priceStandSalons != null) {
            priceStandSalons.forEach(i -> i.setSalon(this));
        }
        this.priceStandSalons = priceStandSalons;
    }

    public Salon priceStandSalons(Set<PriceStandSalon> priceStandSalons) {
        this.setPriceStandSalons(priceStandSalons);
        return this;
    }

    public Salon addPriceStandSalon(PriceStandSalon priceStandSalon) {
        this.priceStandSalons.add(priceStandSalon);
        priceStandSalon.setSalon(this);
        return this;
    }

    public Salon removePriceStandSalon(PriceStandSalon priceStandSalon) {
        this.priceStandSalons.remove(priceStandSalon);
        priceStandSalon.setSalon(null);
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
