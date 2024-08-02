package ch.salon.domain;

import ch.salon.domain.enumeration.Status;
import ch.salon.domain.enumeration.Type;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * A Invoice.
 */
@Entity
@Table(name = "invoice")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Invoice implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "generation_date")
    private Instant generationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private Type type;

    @Column(name = "label")
    private String label;

    @Column(name = "default_amount")
    private Double defaultAmount;

    @Column(name = "custom_amount")
    private Double customAmount;

    @Column(name = "quantity")
    private Long quantity;

    @Column(name = "total")
    private Double total;

    @Column(name = "lock")
    private Boolean lock;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties(value = { "conferences", "payments", "invoices", "stands", "salon" }, allowSetters = true)
    private Participation participation;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Invoice id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getGenerationDate() {
        return this.generationDate;
    }

    public Invoice generationDate(Instant generationDate) {
        this.setGenerationDate(generationDate);
        return this;
    }

    public void setGenerationDate(Instant generationDate) {
        this.generationDate = generationDate;
    }

    public String getLabel() {
        return this.label;
    }

    public Invoice label(String label) {
        this.setLabel(label);
        return this;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Double getDefaultAmount() {
        return this.defaultAmount;
    }

    public Invoice defaultAmount(Double defaultAmount) {
        this.setDefaultAmount(defaultAmount);
        return this;
    }

    public void setDefaultAmount(Double defaultAmount) {
        this.defaultAmount = defaultAmount;
    }

    public Double getCustomAmount() {
        return this.customAmount;
    }

    public Invoice customAmount(Double customAmount) {
        this.setCustomAmount(customAmount);
        return this;
    }

    public void setCustomAmount(Double customAmount) {
        this.customAmount = customAmount;
    }

    public Long getQuantity() {
        return this.quantity;
    }

    public Invoice quantity(Long quantity) {
        this.setQuantity(quantity);
        return this;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public Double getTotal() {
        return this.total;
    }

    public Invoice total(Double total) {
        this.setTotal(total);
        return this;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public Boolean getLock() {
        return this.lock;
    }

    public Invoice lock(Boolean lock) {
        this.setLock(lock);
        return this;
    }

    public void setLock(Boolean lock) {
        this.lock = lock;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public Invoice extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Participation getParticipation() {
        return this.participation;
    }

    public void setParticipation(Participation participation) {
        this.participation = participation;
    }

    public Invoice participation(Participation participation) {
        this.setParticipation(participation);
        return this;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Invoice)) {
            return false;
        }
        return getId() != null && getId().equals(((Invoice) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Invoice{" +
            "id=" + getId() +
            ", generationDate='" + getGenerationDate() + "'" +
            ", type='" + getType() + "'" +
            ", label='" + getLabel() + "'" +
            ", defaultAmount=" + getDefaultAmount() +
            ", customAmount=" + getCustomAmount() +
            ", quantity=" + getQuantity() +
            ", total=" + getTotal() +
            ", lock='" + getLock() + "'" +
            ", extraInformation='" + getExtraInformation() + "'" +
            "}";
    }
}
