package ch.salon.domain;

import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
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

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "participation")
    @JsonIgnoreProperties(value = { "participation" }, allowSetters = true)
    private Set<Conference> conferences = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "participation")
    @JsonIgnoreProperties(value = { "participation" }, allowSetters = true)
    private Set<Payment> payments = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "participation")
    @JsonIgnoreProperties(value = { "participation" }, allowSetters = true)
    private Set<Invoice> invoices = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "participation")
    @JsonIgnoreProperties(value = { "participation", "dimension" }, allowSetters = true)
    private Set<Stand> stands = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "participations" }, allowSetters = true)
    private Exponent exponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "participations", "priceStandSalons", "configuration" }, allowSetters = true)
    private Salon salon;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Participation id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getRegistrationDate() {
        return this.registrationDate;
    }

    public Participation registrationDate(Instant registrationDate) {
        this.setRegistrationDate(registrationDate);
        return this;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Long getNbMeal1() {
        return this.nbMeal1;
    }

    public Participation nbMeal1(Long nbMeal1) {
        this.setNbMeal1(nbMeal1);
        return this;
    }

    public void setNbMeal1(Long nbMeal1) {
        this.nbMeal1 = nbMeal1;
    }

    public Long getNbMeal2() {
        return this.nbMeal2;
    }

    public Participation nbMeal2(Long nbMeal2) {
        this.setNbMeal2(nbMeal2);
        return this;
    }

    public void setNbMeal2(Long nbMeal2) {
        this.nbMeal2 = nbMeal2;
    }

    public Long getNbMeal3() {
        return this.nbMeal3;
    }

    public Participation nbMeal3(Long nbMeal3) {
        this.setNbMeal3(nbMeal3);
        return this;
    }

    public void setNbMeal3(Long nbMeal3) {
        this.nbMeal3 = nbMeal3;
    }

    public Boolean getAcceptedChart() {
        return this.acceptedChart;
    }

    public Participation acceptedChart(Boolean acceptedChart) {
        this.setAcceptedChart(acceptedChart);
        return this;
    }

    public void setAcceptedChart(Boolean acceptedChart) {
        this.acceptedChart = acceptedChart;
    }

    public Boolean getAcceptedContract() {
        return this.acceptedContract;
    }

    public Participation acceptedContract(Boolean acceptedContract) {
        this.setAcceptedContract(acceptedContract);
        return this;
    }

    public void setAcceptedContract(Boolean acceptedContract) {
        this.acceptedContract = acceptedContract;
    }

    public Boolean getNeedArrangment() {
        return this.needArrangment;
    }

    public Participation needArrangment(Boolean needArrangment) {
        this.setNeedArrangment(needArrangment);
        return this;
    }

    public void setNeedArrangment(Boolean needArrangment) {
        this.needArrangment = needArrangment;
    }

    public Boolean getIsBillingClosed() {
        return this.isBillingClosed;
    }

    public Participation isBillingClosed(Boolean isBillingClosed) {
        this.setIsBillingClosed(isBillingClosed);
        return this;
    }

    public void setIsBillingClosed(Boolean isBillingClosed) {
        this.isBillingClosed = isBillingClosed;
    }

    public Status getStatus() {
        return this.status;
    }

    public Participation status(Status status) {
        this.setStatus(status);
        return this;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public Participation extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Set<Conference> getConferences() {
        return this.conferences;
    }

    public void setConferences(Set<Conference> conferences) {
        if (this.conferences != null) {
            this.conferences.forEach(i -> i.setParticipation(null));
        }
        if (conferences != null) {
            conferences.forEach(i -> i.setParticipation(this));
        }
        this.conferences = conferences;
    }

    public Participation conferences(Set<Conference> conferences) {
        this.setConferences(conferences);
        return this;
    }

    public Participation addConference(Conference conference) {
        this.conferences.add(conference);
        conference.setParticipation(this);
        return this;
    }

    public Participation removeConference(Conference conference) {
        this.conferences.remove(conference);
        conference.setParticipation(null);
        return this;
    }

    public Set<Payment> getPayments() {
        return this.payments;
    }

    public void setPayments(Set<Payment> payments) {
        if (this.payments != null) {
            this.payments.forEach(i -> i.setParticipation(null));
        }
        if (payments != null) {
            payments.forEach(i -> i.setParticipation(this));
        }
        this.payments = payments;
    }

    public Participation payments(Set<Payment> payments) {
        this.setPayments(payments);
        return this;
    }

    public Participation addPayment(Payment payment) {
        this.payments.add(payment);
        payment.setParticipation(this);
        return this;
    }

    public Participation removePayment(Payment payment) {
        this.payments.remove(payment);
        payment.setParticipation(null);
        return this;
    }

    public Set<Invoice> getInvoices() {
        return this.invoices;
    }

    public void setInvoices(Set<Invoice> invoices) {
        if (this.invoices != null) {
            this.invoices.forEach(i -> i.setParticipation(null));
        }
        if (invoices != null) {
            invoices.forEach(i -> i.setParticipation(this));
        }
        this.invoices = invoices;
    }

    public Participation invoices(Set<Invoice> invoices) {
        this.setInvoices(invoices);
        return this;
    }

    public Participation addInvoice(Invoice invoice) {
        this.invoices.add(invoice);
        invoice.setParticipation(this);
        return this;
    }

    public Participation removeInvoice(Invoice invoice) {
        this.invoices.remove(invoice);
        invoice.setParticipation(null);
        return this;
    }

    public Set<Stand> getStands() {
        return this.stands;
    }

    public void setStands(Set<Stand> stands) {
        if (this.stands != null) {
            this.stands.forEach(i -> i.setParticipation(null));
        }
        if (stands != null) {
            stands.forEach(i -> i.setParticipation(this));
        }
        this.stands = stands;
    }

    public Participation stands(Set<Stand> stands) {
        this.setStands(stands);
        return this;
    }

    public Participation addStand(Stand stand) {
        this.stands.add(stand);
        stand.setParticipation(this);
        return this;
    }

    public Participation removeStand(Stand stand) {
        this.stands.remove(stand);
        stand.setParticipation(null);
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
