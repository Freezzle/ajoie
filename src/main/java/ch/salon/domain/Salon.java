package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
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

    @Column(name = "place")
    private String place;

    @Column(name = "starting_date")
    private Instant startingDate;

    @Column(name = "ending_date")
    private Instant endingDate;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "salon")
    @JsonIgnoreProperties(value = { "invoices", "exponent", "salon", "dimension" }, allowSetters = true)
    private Set<Stand> stands = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "salon")
    @JsonIgnoreProperties(value = { "salon", "exponent" }, allowSetters = true)
    private Set<Conference> conferences = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "salon")
    @JsonIgnoreProperties(value = { "dimension", "salon" }, allowSetters = true)
    private Set<PriceStandSalon> priceStandSalons = new HashSet<>();

    @JsonIgnoreProperties(value = { "salon" }, allowSetters = true)
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "salon")
    private ConfigurationSalon configuration;

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

    public Set<Stand> getStands() {
        return this.stands;
    }

    public void setStands(Set<Stand> stands) {
        if (this.stands != null) {
            this.stands.forEach(i -> i.setSalon(null));
        }
        if (stands != null) {
            stands.forEach(i -> i.setSalon(this));
        }
        this.stands = stands;
    }

    public Salon stands(Set<Stand> stands) {
        this.setStands(stands);
        return this;
    }

    public Salon addStand(Stand stand) {
        this.stands.add(stand);
        stand.setSalon(this);
        return this;
    }

    public Salon removeStand(Stand stand) {
        this.stands.remove(stand);
        stand.setSalon(null);
        return this;
    }

    public Set<Conference> getConferences() {
        return this.conferences;
    }

    public void setConferences(Set<Conference> conferences) {
        if (this.conferences != null) {
            this.conferences.forEach(i -> i.setSalon(null));
        }
        if (conferences != null) {
            conferences.forEach(i -> i.setSalon(this));
        }
        this.conferences = conferences;
    }

    public Salon conferences(Set<Conference> conferences) {
        this.setConferences(conferences);
        return this;
    }

    public Salon addConference(Conference conference) {
        this.conferences.add(conference);
        conference.setSalon(this);
        return this;
    }

    public Salon removeConference(Conference conference) {
        this.conferences.remove(conference);
        conference.setSalon(null);
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

    public ConfigurationSalon getConfiguration() {
        return this.configuration;
    }

    public void setConfiguration(ConfigurationSalon configurationSalon) {
        if (this.configuration != null) {
            this.configuration.setSalon(null);
        }
        if (configurationSalon != null) {
            configurationSalon.setSalon(this);
        }
        this.configuration = configurationSalon;
    }

    public Salon configuration(ConfigurationSalon configurationSalon) {
        this.setConfiguration(configurationSalon);
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
            "}";
    }
}
