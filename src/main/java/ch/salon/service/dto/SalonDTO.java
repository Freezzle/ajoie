package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
public class SalonDTO implements Serializable {

    private UUID id;
    private String referenceNumber;
    private String place;
    private Instant startingDate;
    private Instant endingDate;
    private Double priceMeal1;
    private Double priceMeal2;
    private Double priceMeal3;
    private Double priceConference;
    private Double priceWorkshop;
    private Double priceSharingStand;
    private String extraInformation;
    private Set<PriceStandDTO> priceStandSalons = new HashSet<>();
}
