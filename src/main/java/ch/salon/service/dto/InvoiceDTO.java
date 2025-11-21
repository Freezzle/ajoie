package ch.salon.service.dto;

import ch.salon.domain.enumeration.Type;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
public class InvoiceDTO implements Serializable {

    private UUID id;
    private Instant generationDate;
    private UUID referenceId;
    private Type type;
    private String label;
    private Double defaultAmount;
    private Double customAmount;
    private Long quantity;
    private Boolean lock;
    private String extraInformation;
}
