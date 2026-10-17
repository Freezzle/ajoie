package ch.salon.service.dto.registration;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

/**
 * Dimension de stand exposée publiquement, avec son prix afin que l'exposant
 * puisse estimer le coût de son inscription.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicDimensionDTO implements Serializable {

    private UUID id;
    private String dimension;
    private Double widthMeter;
    private Double heightMeter;
    private Double price;
}
