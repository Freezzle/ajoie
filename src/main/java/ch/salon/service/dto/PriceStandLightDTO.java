package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class PriceStandLightDTO implements Serializable {

    private UUID id;
    private Double price;
    private String dimension;
    private Double widthMeter;
    private Double heightMeter;
}
