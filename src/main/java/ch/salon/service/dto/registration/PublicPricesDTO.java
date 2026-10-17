package ch.salon.service.dto.registration;

import lombok.Data;

import java.io.Serializable;

/**
 * Prix d'un salon exposés publiquement, afin que l'exposant puisse estimer le coût
 * de son inscription. Lecture seule : aucun prix n'est accepté en entrée.
 */
@Data
public class PublicPricesDTO implements Serializable {

    private Double priceMeal1;
    private Double priceMeal2;
    private Double priceMeal3;
    private Double priceConference;
    private Double priceWorkshop;
    private Double priceSharingStand;
    private Double pricePostalFee;
}
