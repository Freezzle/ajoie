package ch.salon.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * A Billing.
 */
@Entity
@Table(name = "billing")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Billing implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "accepted_contract")
    private Boolean acceptedContract;

    @Column(name = "need_arrangment")
    private Boolean needArrangment;

    @Column(name = "is_closed")
    private Boolean isClosed;

    @JsonIgnoreProperties(value = { "billing", "exponent", "salon", "dimension" }, allowSetters = true)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(unique = true)
    private Stand stand;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "billing")
    @JsonIgnoreProperties(value = { "billing" }, allowSetters = true)
    private Set<Invoice> invoices = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Billing id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Boolean getAcceptedContract() {
        return this.acceptedContract;
    }

    public Billing acceptedContract(Boolean acceptedContract) {
        this.setAcceptedContract(acceptedContract);
        return this;
    }

    public void setAcceptedContract(Boolean acceptedContract) {
        this.acceptedContract = acceptedContract;
    }

    public Boolean getNeedArrangment() {
        return this.needArrangment;
    }

    public Billing needArrangment(Boolean needArrangment) {
        this.setNeedArrangment(needArrangment);
        return this;
    }

    public void setNeedArrangment(Boolean needArrangment) {
        this.needArrangment = needArrangment;
    }

    public Boolean getIsClosed() {
        return this.isClosed;
    }

    public Billing isClosed(Boolean isClosed) {
        this.setIsClosed(isClosed);
        return this;
    }

    public void setIsClosed(Boolean isClosed) {
        this.isClosed = isClosed;
    }

    public Stand getStand() {
        return this.stand;
    }

    public void setStand(Stand stand) {
        this.stand = stand;
    }

    public Billing stand(Stand stand) {
        this.setStand(stand);
        return this;
    }

    public Set<Invoice> getInvoices() {
        return this.invoices;
    }

    public void setInvoices(Set<Invoice> invoices) {
        if (this.invoices != null) {
            this.invoices.forEach(i -> i.setBilling(null));
        }
        if (invoices != null) {
            invoices.forEach(i -> i.setBilling(this));
        }
        this.invoices = invoices;
    }

    public Billing invoices(Set<Invoice> invoices) {
        this.setInvoices(invoices);
        return this;
    }

    public Billing addInvoice(Invoice invoice) {
        this.invoices.add(invoice);
        invoice.setBilling(this);
        return this;
    }

    public Billing removeInvoice(Invoice invoice) {
        this.invoices.remove(invoice);
        invoice.setBilling(null);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Billing)) {
            return false;
        }
        return getId() != null && getId().equals(((Billing) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Billing{" +
            "id=" + getId() +
            ", acceptedContract='" + getAcceptedContract() + "'" +
            ", needArrangment='" + getNeedArrangment() + "'" +
            ", isClosed='" + getIsClosed() + "'" +
            "}";
    }
}
