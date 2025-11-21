package ch.salon.service.dto;

import ch.salon.domain.enumeration.Mode;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
public class PaymentDTO implements Serializable {

    private UUID id;
    private Double amount;
    private Instant billingDate;
    private Mode paymentMode;
    private String extraInformation;
}
