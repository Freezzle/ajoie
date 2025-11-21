package ch.salon.service.dto;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
public class InvoicingPlanDTO implements Serializable {

    private UUID id;
    private Instant generationDate;
    private Instant issuedDate;
    private Instant expirationDate;
    private Boolean needArrangement;
    private InvoiceSendingMethod invoiceSendingMethod;
    private State state;
    private String billingNumber;
    private Set<InvoiceDTO> invoices = new HashSet<>();
    private Set<PaymentDTO> payments = new HashSet<>();
    private ParticipationLightDTO participation;
}
