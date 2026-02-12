package ch.salon.service.dto;

import ch.salon.domain.enumeration.State;
import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class InvoicingPlanListDTO implements Serializable {

    private UUID id;
    private String billingNumber;
    private State state;
    private ParticipationLightDTO participation;
    private Integer nbInvoiceLines;
    private Double totalAmount;
    private Double paidAmount;
    private Double balance;
}
