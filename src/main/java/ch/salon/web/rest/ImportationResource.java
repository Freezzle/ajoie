package ch.salon.web.rest;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.InvoicingPlanService;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing {@link Invoice}.
 */
@RestController
@RequestMapping("/api/importation")
@Transactional
public class ImportationResource {

    private static final Logger log = LoggerFactory.getLogger(ImportationResource.class);
    private static final int STAND_REGISTRATION_DATE = 0;
    private static final int EXPONENT_EMAIL = 1;
    private static final int EXPONENT_FULL_NAME = 2;
    private static final int EXPONENT_ADDRESS = 3;
    private static final int EXPONENT_NPA_LOCALITE = 4;
    private static final int EXPONENT_PHONE_NUMBER = 5;
    private static final int STAND_DESCRIPTION = 6;
    private static final int EXPONENT_WEBSITE = 7;
    private static final int EXPONENT_SOCIAL_MEDIA = 8;
    private static final int STAND_MEAL_1 = 9;
    private static final int STAND_MEAL_2 = 10;
    private static final int STAND_MEAL_3 = 11;
    private static final int STAND_DIMENSION = 12;
    private static final int STAND_CONFERENCE = 13;
    private static final int CONFERENCE_DESCRIPTION = 14;
    private static final int STAND_SHARING = 15;
    private static final int STAND_NB_TABLE = 16;
    private static final int STAND_NB_CHAIR = 17;
    private static final int STAND_ELECTRICITY = 18;
    private static final int STAND_ACCEPTED_CONTRACT = 19;
    private static final int STAND_ARRANGMENT = 19;
    private static final int STAND_ACCEPTED_CHART = 20;
    private static final int EXPONENT_URL_PICTURE = 21;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final SalonRepository salonRepository;
    private final StandRepository standRepository;
    private final ExponentRepository exponentRepository;
    private final ConferenceRepository conferenceRepository;
    private final DimensionStandRepository dimensionStandRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanService invoiceService;

    public ImportationResource(
        SalonRepository salonRepository,
        StandRepository standRepository,
        ExponentRepository exponentRepository,
        ConferenceRepository conferenceRepository,
        DimensionStandRepository dimensionStandRepository,
        ParticipationRepository participationRepository,
        InvoicingPlanService invoicingPlanService
    ) {
        this.salonRepository = salonRepository;
        this.standRepository = standRepository;
        this.exponentRepository = exponentRepository;
        this.conferenceRepository = conferenceRepository;
        this.dimensionStandRepository = dimensionStandRepository;
        this.participationRepository = participationRepository;
        this.invoiceService = invoicingPlanService;
    }

    @PostMapping("")
    public ResponseEntity<Void> importation(@RequestParam(name = "idSalon", required = false) String idSalon) throws URISyntaxException {
        try (
            Reader reader = new FileReader(
                "E:\\ajoiedumieuxvivre\\src\\main\\java\\ch\\salon\\importation\\formulaire_2024.csv",
                Charset.defaultCharset()
            );
            CSVParser csvParser = new CSVParser(reader, CSVFormat.EXCEL.withDelimiter(';'))
        ) {
            Salon currentSalon = salonRepository.findById(UUID.fromString(idSalon)).orElseThrow();

            List<DimensionStand> dimensionStands = dimensionStandRepository.findAll();
            if (dimensionStands.isEmpty()) {
                // TODO : A supprimer plus tard
                DimensionStand dimension2x2Stand = new DimensionStand();
                dimension2x2Stand.setDimension("2 m x 2 m");
                dimension2x2Stand = dimensionStandRepository.save(dimension2x2Stand);
                DimensionStand dimension25x2Stand = new DimensionStand();
                dimension25x2Stand.setDimension("2.5 m x 2 m");
                dimension25x2Stand = dimensionStandRepository.save(dimension25x2Stand);
                DimensionStand dimension25Cotex2Stand = new DimensionStand();
                dimension25Cotex2Stand.setDimension("2.5 m x 2 m (possible de vendre des deux côtés)");
                dimension25Cotex2Stand = dimensionStandRepository.save(dimension25Cotex2Stand);
                DimensionStand dimension3x2Stand = new DimensionStand();
                dimension3x2Stand.setDimension("3 m x 2 m");
                dimension3x2Stand = dimensionStandRepository.save(dimension3x2Stand);
                DimensionStand dimension3x25Stand = new DimensionStand();
                dimension3x25Stand.setDimension("3 m x 2.5 m");
                dimension3x25Stand = dimensionStandRepository.save(dimension3x25Stand);
                DimensionStand dimension4x2Stand = new DimensionStand();
                dimension4x2Stand.setDimension("4 m x 2 m");
                dimension4x2Stand = dimensionStandRepository.save(dimension4x2Stand);
                DimensionStand dimensionAutres = new DimensionStand();
                dimensionAutres.setDimension("Autres");
                dimensionAutres = dimensionStandRepository.save(dimensionAutres);

                PriceStandSalon dimension2x2PriceStand = new PriceStandSalon();
                dimension2x2PriceStand.setPrice(260.0);
                dimension2x2PriceStand.setDimension(dimension2x2Stand);
                currentSalon.addPriceStandSalon(dimension2x2PriceStand);

                PriceStandSalon dimension25x2PriceStand = new PriceStandSalon();
                dimension25x2PriceStand.setPrice(300.0);
                dimension25x2PriceStand.setDimension(dimension25x2Stand);
                currentSalon.addPriceStandSalon(dimension25x2PriceStand);

                PriceStandSalon dimension25Cotex2PriceStand = new PriceStandSalon();
                dimension25Cotex2PriceStand.setPrice(350.0);
                dimension25Cotex2PriceStand.setDimension(dimension25Cotex2Stand);
                currentSalon.addPriceStandSalon(dimension25Cotex2PriceStand);

                PriceStandSalon dimension3x2PriceStand = new PriceStandSalon();
                dimension3x2PriceStand.setPrice(350.0);
                dimension3x2PriceStand.setDimension(dimension3x2Stand);
                currentSalon.addPriceStandSalon(dimension3x2PriceStand);

                PriceStandSalon dimension3x25PriceStand = new PriceStandSalon();
                dimension3x25PriceStand.setPrice(400.0);
                dimension3x25PriceStand.setDimension(dimension3x25Stand);
                currentSalon.addPriceStandSalon(dimension3x25PriceStand);

                PriceStandSalon dimension4x2PriceStand = new PriceStandSalon();
                dimension4x2PriceStand.setPrice(480.0);
                dimension4x2PriceStand.setDimension(dimension4x2Stand);
                currentSalon.addPriceStandSalon(dimension4x2PriceStand);

                PriceStandSalon dimensionPriceAutres = new PriceStandSalon();
                dimensionPriceAutres.setPrice(500.0);
                dimensionPriceAutres.setDimension(dimensionAutres);
                currentSalon.addPriceStandSalon(dimensionPriceAutres);

                currentSalon = salonRepository.save(currentSalon);

                dimensionStands = dimensionStandRepository.findAll();
            }

            int index = 0;
            for (CSVRecord csvRecord : csvParser) {
                if (index == 0) {
                    index++;
                    continue;
                }

                System.out.println("Line number : " + index);

                String standRegistrationDate = csvRecord.get(STAND_REGISTRATION_DATE);
                // To stop the process
                if (StringUtils.isBlank(standRegistrationDate)) {
                    break;
                }

                String exponentEmail = csvRecord.get(EXPONENT_EMAIL);
                String exponentFullname = csvRecord.get(EXPONENT_FULL_NAME);
                String exponentAddress = csvRecord.get(EXPONENT_ADDRESS);
                String exponentNpaLocalite = csvRecord.get(EXPONENT_NPA_LOCALITE);
                String exponentPhone = csvRecord.get(EXPONENT_PHONE_NUMBER);

                Exponent currentExponent = new Exponent();
                currentExponent.setEmail(sub(exponentEmail));
                currentExponent.setFullName(sub(exponentFullname));
                currentExponent.setAddress(sub(exponentAddress));
                currentExponent.setNpaLocalite(sub(exponentNpaLocalite));
                currentExponent.setPhoneNumber(exponentPhone);
                currentExponent.setPhoneNumber(exponentPhone);
                currentExponent = exponentRepository.save(currentExponent);

                String participationMeal1 = csvRecord.get(STAND_MEAL_1);
                String participationMeal2 = csvRecord.get(STAND_MEAL_2);
                String participationMeal3 = csvRecord.get(STAND_MEAL_3);
                String participationAcceptedContract = csvRecord.get(STAND_ACCEPTED_CONTRACT);
                String participationArrangment = csvRecord.get(STAND_ARRANGMENT);
                String participationAcceptedChart = csvRecord.get(STAND_ACCEPTED_CHART);

                Participation currentParticipation = new Participation();
                currentParticipation.setClientNumber(
                    currentSalon.getReferenceNumber() + "-" + incrementClientNumber(participationRepository.findMaxClientNumber())
                );
                currentParticipation.setSalon(currentSalon);
                currentParticipation.setExponent(currentExponent);
                currentParticipation.setNbMeal1(Long.parseLong(participationMeal1.trim()));
                currentParticipation.setNbMeal2(Long.parseLong(participationMeal2.trim()));
                currentParticipation.setNbMeal3(Long.parseLong(participationMeal3.trim()));
                currentParticipation.setAcceptedContract(participationAcceptedContract.contains("accepte"));
                currentParticipation.setNeedArrangment(participationArrangment.contains("arrangement"));
                currentParticipation.setAcceptedChart(participationAcceptedChart.contains("accepte"));
                currentParticipation.setRegistrationDate(Instant.now());
                currentParticipation.setStatus(Status.IN_VERIFICATION);
                currentParticipation.setIsBillingClosed(false);

                String standDescription = csvRecord.get(STAND_DESCRIPTION);
                String standDimension = csvRecord.get(STAND_DIMENSION);
                String standSharing = csvRecord.get(STAND_SHARING);
                String standNbTable = csvRecord.get(STAND_NB_TABLE);
                String standNbChair = csvRecord.get(STAND_NB_CHAIR);
                String standElectricity = csvRecord.get(STAND_ELECTRICITY);
                String standWebsite = csvRecord.get(EXPONENT_WEBSITE);
                String standSocialMedia = csvRecord.get(EXPONENT_SOCIAL_MEDIA);
                String standUrlPicture = csvRecord.get(EXPONENT_URL_PICTURE);

                Stand currentStand = new Stand();
                currentStand.setParticipation(currentParticipation);
                currentStand.setDescription(sub(standDescription));
                currentStand.setWebsite(sub(standWebsite));
                currentStand.setSocialMedia(sub(standSocialMedia));
                currentStand.setUrlPicture(sub(standUrlPicture));
                currentStand.setDimension(findDimension(dimensionStands, standDimension));
                currentStand.setShared(standSharing.equalsIgnoreCase("oui"));
                currentStand.setNbTable(standNbTable.contains("Aucune") ? 0 : Long.parseLong(standNbTable.substring(0, 1)));
                currentStand.setNbChair(standNbChair.contains("Aucune") ? 0 : Long.parseLong(standNbChair.substring(0, 1)));
                currentStand.setNeedElectricity(standElectricity.equalsIgnoreCase("oui"));
                currentStand.setStatus(Status.IN_VERIFICATION);
                standRepository.save(currentStand);

                String conferenceDescription = csvRecord.get(CONFERENCE_DESCRIPTION);
                String standConference = csvRecord.get(STAND_CONFERENCE);

                if (standConference.equalsIgnoreCase("oui")) {
                    Conference currentConference = new Conference();
                    currentConference.setParticipation(currentParticipation);
                    currentConference.setTitle(sub(conferenceDescription));
                    currentConference.setStatus(Status.IN_VERIFICATION);
                    conferenceRepository.save(currentConference);
                }

                currentParticipation = participationRepository.save(currentParticipation);

                invoiceService.generateInvoicingPlan(currentParticipation.getId().toString());
                index++;
            }
        } catch (IOException e) {}

        return ResponseEntity.created(new URI("/api/importation")).build();
    }

    private DimensionStand findDimension(List<DimensionStand> dimensions, String dimension) {
        return dimensions
            .stream()
            .filter(dim -> dimension.contains(dim.getDimension()))
            .findFirst()
            .orElseGet(() -> {
                DimensionStand newDimensionStand = new DimensionStand();
                newDimensionStand.setDimension(sub(dimension));
                DimensionStand saved = dimensionStandRepository.save(newDimensionStand);
                dimensions.add(saved);
                return saved;
            });
    }

    private String incrementClientNumber(String clientNumber) {
        int number = 100;
        if (clientNumber != null) {
            // Convertir la partie numérique après le tiret en entier
            number = Integer.parseInt(clientNumber.split("-")[1]);
        }

        // Incrémenter le nombre
        number = number + 1;

        // Reformater le numéro incrémenté avec le même nombre de chiffres
        return String.format("%03d", number);
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(250, chaine.length())) : null;
    }
}
