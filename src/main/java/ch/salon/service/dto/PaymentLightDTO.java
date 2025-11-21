package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class PaymentLightDTO implements Serializable {

    private UUID id;
    private Double amount;
}
