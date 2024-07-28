package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A Stand.
 */
@Entity
@Table(name = "stand")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Stand implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "description")
    private String description;

    @Column(name = "nb_meal_1")
    private Long nbMeal1;

    @Column(name = "nb_meal_2")
    private Long nbMeal2;

    @Column(name = "nb_meal_3")
    private Long nbMeal3;

    @Column(name = "shared")
    private Boolean shared;

    @Column(name = "nb_table")
    private Long nbTable;

    @Column(name = "nb_chair")
    private Long nbChair;

    @Column(name = "need_electricity")
    private Boolean needElectricity;

    @Column(name = "accepted_chart")
    private Boolean acceptedChart;

    @Column(name = "accepted_contract")
    private Boolean acceptedContract;

    @Column(name = "need_arrangment")
    private Boolean needArrangment;

    @Column(name = "is_closed")
    private Boolean isClosed;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "stand")
    @JsonIgnoreProperties(value = { "billing" }, allowSetters = true)
    private Set<Invoice> invoices = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "stands", "conferences" }, allowSetters = true)
    private Exponent exponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "stands", "conferences", "priceStandSalons", "configuration" }, allowSetters = true)
    private Salon salon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "priceStandSalons", "stands" }, allowSetters = true)
    private DimensionStand dimension;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Stand id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getDescription() {
        return this.description;
    }

    public Stand description(String description) {
        this.setDescription(description);
        return this;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getNbMeal1() {
        return this.nbMeal1;
    }

    public Stand nbMeal1(Long nbMeal1) {
        this.setNbMeal1(nbMeal1);
        return this;
    }

    public void setNbMeal1(Long nbMeal1) {
        this.nbMeal1 = nbMeal1;
    }

    public Long getNbMeal2() {
        return this.nbMeal2;
    }

    public Stand nbMeal2(Long nbMeal2) {
        this.setNbMeal2(nbMeal2);
        return this;
    }

    public void setNbMeal2(Long nbMeal2) {
        this.nbMeal2 = nbMeal2;
    }

    public Long getNbMeal3() {
        return this.nbMeal3;
    }

    public Stand nbMeal3(Long nbMeal3) {
        this.setNbMeal3(nbMeal3);
        return this;
    }

    public void setNbMeal3(Long nbMeal3) {
        this.nbMeal3 = nbMeal3;
    }

    public Boolean getShared() {
        return this.shared;
    }

    public Stand shared(Boolean shared) {
        this.setShared(shared);
        return this;
    }

    public void setShared(Boolean shared) {
        this.shared = shared;
    }

    public Long getNbTable() {
        return this.nbTable;
    }

    public Stand nbTable(Long nbTable) {
        this.setNbTable(nbTable);
        return this;
    }

    public void setNbTable(Long nbTable) {
        this.nbTable = nbTable;
    }

    public Long getNbChair() {
        return this.nbChair;
    }

    public Stand nbChair(Long nbChair) {
        this.setNbChair(nbChair);
        return this;
    }

    public void setNbChair(Long nbChair) {
        this.nbChair = nbChair;
    }

    public Boolean getNeedElectricity() {
        return this.needElectricity;
    }

    public Stand needElectricity(Boolean needElectricity) {
        this.setNeedElectricity(needElectricity);
        return this;
    }

    public void setNeedElectricity(Boolean needElectricity) {
        this.needElectricity = needElectricity;
    }

    public Boolean getAcceptedChart() {
        return this.acceptedChart;
    }

    public Stand acceptedChart(Boolean acceptedChart) {
        this.setAcceptedChart(acceptedChart);
        return this;
    }

    public void setAcceptedChart(Boolean acceptedChart) {
        this.acceptedChart = acceptedChart;
    }

    public Exponent getExponent() {
        return this.exponent;
    }

    public void setExponent(Exponent exponent) {
        this.exponent = exponent;
    }

    public Stand exponent(Exponent exponent) {
        this.setExponent(exponent);
        return this;
    }

    public Salon getSalon() {
        return this.salon;
    }

    public void setSalon(Salon salon) {
        this.salon = salon;
    }

    public Stand salon(Salon salon) {
        this.setSalon(salon);
        return this;
    }

    public DimensionStand getDimension() {
        return this.dimension;
    }

    public void setDimension(DimensionStand dimensionStand) {
        this.dimension = dimensionStand;
    }

    public Stand dimension(DimensionStand dimensionStand) {
        this.setDimension(dimensionStand);
        return this;
    }

    public Boolean getAcceptedContract() {
        return this.acceptedContract;
    }

    public Stand acceptedContract(Boolean acceptedContract) {
        this.setAcceptedContract(acceptedContract);
        return this;
    }

    public void setAcceptedContract(Boolean acceptedContract) {
        this.acceptedContract = acceptedContract;
    }

    public Boolean getNeedArrangment() {
        return this.needArrangment;
    }

    public Stand needArrangment(Boolean needArrangment) {
        this.setNeedArrangment(needArrangment);
        return this;
    }

    public void setNeedArrangment(Boolean needArrangment) {
        this.needArrangment = needArrangment;
    }

    public Boolean getIsClosed() {
        return this.isClosed;
    }

    public Stand isClosed(Boolean isClosed) {
        this.setIsClosed(isClosed);
        return this;
    }

    public void setIsClosed(Boolean isClosed) {
        this.isClosed = isClosed;
    }

    public Set<Invoice> getInvoices() {
        return this.invoices;
    }

    public void setInvoices(Set<Invoice> invoices) {
        if (this.invoices != null) {
            this.invoices.forEach(i -> i.setStand(null));
        }
        if (invoices != null) {
            invoices.forEach(i -> i.setStand(this));
        }
        this.invoices = invoices;
    }

    public Stand invoices(Set<Invoice> invoices) {
        this.setInvoices(invoices);
        return this;
    }

    public Stand addInvoice(Invoice invoice) {
        this.invoices.add(invoice);
        invoice.setStand(this);
        return this;
    }

    public Stand removeInvoice(Invoice invoice) {
        this.invoices.remove(invoice);
        invoice.setStand(null);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Stand)) {
            return false;
        }
        return getId() != null && getId().equals(((Stand) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Stand{" +
            "id=" + getId() +
            ", description='" + getDescription() + "'" +
            ", nbMeal1=" + getNbMeal1() +
            ", nbMeal2=" + getNbMeal2() +
            ", nbMeal3=" + getNbMeal3() +
            ", shared='" + getShared() + "'" +
            ", nbTable=" + getNbTable() +
            ", nbChair=" + getNbChair() +
            ", needElectricity='" + getNeedElectricity() + "'" +
            ", acceptedChart='" + getAcceptedChart() + "'" +
            ", acceptedContract='" + getAcceptedContract() + "'" +
            ", needArrangment='" + getNeedArrangment() + "'" +
            ", isClosed='" + getIsClosed() + "'" +
            "}";
    }
}
