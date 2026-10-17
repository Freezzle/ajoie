package ch.salon.service.dto.registration;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.ModePaymentMeals;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serializable;

/**
 * Participation saisie depuis le formulaire public d'inscription.
 * Aucun champ interne ni de facturation n'est exposé (status, extraInformation, ratings...).
 */
@Data
public class RegistrationParticipationDTO implements Serializable {

    @Size(max = 100)
    private String therapistName;

    @Min(0)
    private long nbMeal1;

    @Min(0)
    private long nbMeal2;

    @Min(0)
    private long nbMeal3;

    private ModePaymentMeals modePaymentMeals;

    @NotNull
    private InvoiceSendingMethod invoiceSendingMethod;

    private boolean hasOffer;

    @Size(max = 500)
    private String offer;

    @Size(max = 1000)
    private String additionnalInformation;

    @AssertTrue
    private boolean acceptedChart;

    @AssertTrue
    private boolean acceptedContract;

    public long totalMeals() {
        return nbMeal1 + nbMeal2 + nbMeal3;
    }
}
