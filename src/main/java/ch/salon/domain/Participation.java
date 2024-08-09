package ch.salon.domain;

import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * A Participation.
 */
@Entity
@Table(name = "participation")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Participation implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "client_number")
    private String clientNumber;

    @Column(name = "registration_date")
    private Instant registrationDate;

    @Column(name = "nb_meal_1")
    private Long nbMeal1;

    @Column(name = "nb_meal_2")
    private Long nbMeal2;

    @Column(name = "nb_meal_3")
    private Long nbMeal3;

    @Column(name = "accepted_chart")
    private Boolean acceptedChart;

    @Column(name = "accepted_contract")
    private Boolean acceptedContract;

    @Column(name = "need_arrangment")
    private Boolean needArrangment;

    @Column(name = "is_billing_closed")
    private Boolean isBillingClosed;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.EAGER)
    private Exponent exponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "priceStandSalons" }, allowSetters = true)
    private Salon salon;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Participation id(UUID id) {
        this.setId(id);
        return this;
    }

    public Instant getRegistrationDate() {
        return this.registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Participation registrationDate(Instant registrationDate) {
        this.setRegistrationDate(registrationDate);
        return this;
    }

    public Long getNbMeal1() {
        return this.nbMeal1;
    }

    public void setNbMeal1(Long nbMeal1) {
        this.nbMeal1 = nbMeal1;
    }

    public Participation nbMeal1(Long nbMeal1) {
        this.setNbMeal1(nbMeal1);
        return this;
    }

    public Long getNbMeal2() {
        return this.nbMeal2;
    }

    public void setNbMeal2(Long nbMeal2) {
        this.nbMeal2 = nbMeal2;
    }

    public Participation nbMeal2(Long nbMeal2) {
        this.setNbMeal2(nbMeal2);
        return this;
    }

    public Long getNbMeal3() {
        return this.nbMeal3;
    }

    public void setNbMeal3(Long nbMeal3) {
        this.nbMeal3 = nbMeal3;
    }

    public Participation nbMeal3(Long nbMeal3) {
        this.setNbMeal3(nbMeal3);
        return this;
    }

    public Boolean getAcceptedChart() {
        return this.acceptedChart;
    }

    public void setAcceptedChart(Boolean acceptedChart) {
        this.acceptedChart = acceptedChart;
    }

    public Participation acceptedChart(Boolean acceptedChart) {
        this.setAcceptedChart(acceptedChart);
        return this;
    }

    public Boolean getAcceptedContract() {
        return this.acceptedContract;
    }

    public void setAcceptedContract(Boolean acceptedContract) {
        this.acceptedContract = acceptedContract;
    }

    public Participation acceptedContract(Boolean acceptedContract) {
        this.setAcceptedContract(acceptedContract);
        return this;
    }

    public Boolean getNeedArrangment() {
        return this.needArrangment;
    }

    public void setNeedArrangment(Boolean needArrangment) {
        this.needArrangment = needArrangment;
    }

    public Participation needArrangment(Boolean needArrangment) {
        this.setNeedArrangment(needArrangment);
        return this;
    }

    public Boolean getIsBillingClosed() {
        return this.isBillingClosed;
    }

    public void setIsBillingClosed(Boolean isBillingClosed) {
        this.isBillingClosed = isBillingClosed;
    }

    public Participation isBillingClosed(Boolean isBillingClosed) {
        this.setIsBillingClosed(isBillingClosed);
        return this;
    }

    public Status getStatus() {
        return this.status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Participation status(Status status) {
        this.setStatus(status);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Participation extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public Exponent getExponent() {
        return this.exponent;
    }

    public void setExponent(Exponent exponent) {
        this.exponent = exponent;
    }

    public Participation exponent(Exponent exponent) {
        this.setExponent(exponent);
        return this;
    }

    public Salon getSalon() {
        return this.salon;
    }

    public void setSalon(Salon salon) {
        this.salon = salon;
    }

    public Participation salon(Salon salon) {
        this.setSalon(salon);
        return this;
    }

    public String getClientNumber() {
        return clientNumber;
    }

    public void setClientNumber(String clientNumber) {
        this.clientNumber = clientNumber;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Participation)) {
            return false;
        }
        return getId() != null && getId().equals(((Participation) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Participation{" +
               "id=" + getId() +
               ", registrationDate='" + getRegistrationDate() + "'" +
               ", clientNumber='" + getClientNumber() + "'" +
               ", nbMeal1=" + getNbMeal1() +
               ", nbMeal2=" + getNbMeal2() +
               ", nbMeal3=" + getNbMeal3() +
               ", acceptedChart='" + getAcceptedChart() + "'" +
               ", acceptedContract='" + getAcceptedContract() + "'" +
               ", needArrangment='" + getNeedArrangment() + "'" +
               ", isBillingClosed='" + getIsBillingClosed() + "'" +
               ", status='" + getStatus() + "'" +
               ", extraInformation='" + getExtraInformation() + "'" +
               "}";
    }
}
