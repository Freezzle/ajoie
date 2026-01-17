package ch.salon.service.dto;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.ModePaymentMeals;
import ch.salon.domain.enumeration.Status;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Data
public class ParticipationDTO implements Serializable {

    private UUID id;
    private String clientNumber;
    private String therapistName;
    private Instant registrationDate;
    private ModePaymentMeals modePaymentMeals;
    private InvoiceSendingMethod invoiceSendingMethod;
    private Long nbMeal1;
    private Long nbMeal2;
    private Long nbMeal3;
    private Boolean acceptedChart;
    private Boolean acceptedContract;
    private Boolean needArrangement;
    private Boolean hasOffer;
    private String offer;
    private String additionnalInformation;
    private Boolean guestOfHonor;
    private Boolean crushOfHeart;
    private Status status;
    private String extraInformation;
    private ExhibitorLightDTO exhibitor;
    private SalonLightDTO salon;
    private Double ratingFriendliness;
    private Double ratingPaymentSpeed;
    private Double ratingServiceQuality;
}
