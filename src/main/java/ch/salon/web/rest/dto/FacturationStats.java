package ch.salon.web.rest.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class FacturationStats implements Serializable {

    private Double paid = 0.00;
    private Double discount = 0.00;
    private Double remaining = 0.00;
    private Double expected = 0.00;
    private Double total = 0.00;
}

