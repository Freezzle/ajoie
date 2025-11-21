package ch.salon.web.rest.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class StandInfoStats implements Serializable {
    private Long nbTable = 0L;
    private Long nbChair = 0L;
    private Long nbElectricity = 0L;
    private Long nbOffer = 0L;
}
