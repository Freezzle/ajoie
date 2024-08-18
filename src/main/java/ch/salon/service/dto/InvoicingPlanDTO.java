package ch.salon.service.dto;

import ch.salon.domain.enumeration.State;
import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class InvoicingPlanDTO implements Serializable {

    private UUID id;
    private Instant generationDate;
    private State state;
    private String billingNumber;
    private Set<InvoiceDTO> invoices = new HashSet<>();
    private Set<PaymentDTO> payments = new HashSet<>();
    private ParticipationLightDTO participation;

    public InvoicingPlanDTO() {
        // Empty constructor needed for Jackson.
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public State getState() {
        return state;
    }

    public void setState(State state) {
        this.state = state;
    }

    public Instant getGenerationDate() {
        return generationDate;
    }

    public void setGenerationDate(Instant generationDate) {
        this.generationDate = generationDate;
    }

    public String getBillingNumber() {
        return billingNumber;
    }

    public void setBillingNumber(String billingNumber) {
        this.billingNumber = billingNumber;
    }

    public Set<InvoiceDTO> getInvoices() {
        return invoices;
    }

    public void setInvoices(Set<InvoiceDTO> invoices) {
        this.invoices = invoices;
    }

    public ParticipationLightDTO getParticipation() {
        return participation;
    }

    public void setParticipation(ParticipationLightDTO participation) {
        this.participation = participation;
    }

    public Set<PaymentDTO> getPayments() {
        return payments;
    }

    public void setPayments(Set<PaymentDTO> payments) {
        this.payments = payments;
    }
}
