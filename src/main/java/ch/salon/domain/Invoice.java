package ch.salon.domain;

import ch.salon.domain.enumeration.Type;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
    private Instant generationDate = Instant.now();

    @Column(name = "reference_id")
    private UUID referenceId;

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

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Invoice() {}

    public Invoice(Invoice invoice) {
        this.id = null;
        this.generationDate = Instant.now();
        this.referenceId = invoice.getReferenceId();
        this.type = invoice.getType();
        this.label = invoice.getLabel();
        this.quantity = invoice.getQuantity();
        this.defaultAmount = invoice.getDefaultAmount();
        this.customAmount = invoice.getCustomAmount();
        this.lock = invoice.getLock();
        this.total = invoice.getTotal();
        this.extraInformation = invoice.getExtraInformation();
    }

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Invoice id(UUID id) {
        this.setId(id);
        return this;
    }

    public Instant getGenerationDate() {
        return this.generationDate;
    }

    public void setGenerationDate(Instant generationDate) {
        this.generationDate = generationDate;
    }

    public Invoice generationDate(Instant generationDate) {
        this.setGenerationDate(generationDate);
        return this;
    }

    public String getLabel() {
        return this.label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Invoice label(String label) {
        this.setLabel(label);
        return this;
    }

    public Double getDefaultAmount() {
        return this.defaultAmount;
    }

    public void setDefaultAmount(Double defaultAmount) {
        this.defaultAmount = defaultAmount;
    }

    public Invoice defaultAmount(Double defaultAmount) {
        this.setDefaultAmount(defaultAmount);
        return this;
    }

    public Double getCustomAmount() {
        return this.customAmount;
    }

    public void setCustomAmount(Double customAmount) {
        this.customAmount = customAmount;
    }

    public Invoice customAmount(Double customAmount) {
        this.setCustomAmount(customAmount);
        return this;
    }

    public Long getQuantity() {
        return this.quantity;
    }

    public void setQuantity(Long quantity) {
        this.quantity = quantity;
    }

    public Invoice quantity(Long quantity) {
        this.setQuantity(quantity);
        return this;
    }

    public Double getTotal() {
        return this.total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public Invoice total(Double total) {
        this.setTotal(total);
        return this;
    }

    public Boolean getLock() {
        return this.lock;
    }

    public void setLock(Boolean lock) {
        this.lock = lock;
    }

    public Invoice lock(Boolean lock) {
        this.setLock(lock);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Invoice extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(UUID referenceId) {
        this.referenceId = referenceId;
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
               ", referenceId=" + getReferenceId() +
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
