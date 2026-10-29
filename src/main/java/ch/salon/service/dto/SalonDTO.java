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
    private boolean archived;
    private boolean registrationEnabled;
    private Instant registrationOpeningDate;
    private Instant registrationClosingDate;
    private String registrationWelcomeTitle;
    private String registrationWelcomeText;
    private String registrationChartText;
    private String registrationSalonChartText;
    private boolean volunteerRegistrationEnabled;
    private Instant volunteerRegistrationOpeningDate;
    private Instant volunteerRegistrationClosingDate;
    private String volunteerRegistrationWelcomeTitle;
    private String volunteerRegistrationWelcomeText;
    private UUID sourceSalonId;
    private AddressDTO headquartersAddress;
    private AddressDTO eventAddress;
    private BankAccountDTO bankAccount;
    private Set<PriceStandDTO> priceStandSalons = new HashSet<>();

    // Compteurs utilisés par le pied de la liste des salons.
    // Les participations, conférences et ateliers écartés (refusés, annulés) sont exclus.
    private long nbParticipations = 0L;
    private long nbConferences = 0L;
    private long nbWorkshops = 0L;
}
