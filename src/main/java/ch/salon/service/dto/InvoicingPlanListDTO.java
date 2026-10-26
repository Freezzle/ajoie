package ch.salon.service.dto;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.State;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class InvoicingPlanListDTO implements Serializable {

    private UUID id;
    private String billingNumber;
    private State state;
    private Instant generationDate;
    private Instant issuedDate;
    private Instant expirationDate;
    private InvoiceSendingMethod invoiceSendingMethod;
    private Boolean needArrangement;
    private ParticipationLightDTO participation;
    private Integer nbInvoiceLines;
    private Double totalAmount;
    private Double paidAmount;
    private Double balance;
    /** Vrai si au moins une ligne a un montant différent du montant par défaut. */
    private Boolean hasCustomPrice;
    /** Date du paiement le plus récent, ou null. */
    private Instant lastPaymentDate;
    /** Dates des rappels envoyés, les plus anciennes d'abord. Rempli par le service. */
    private List<Instant> reminderDates = new ArrayList<>();
}
