package ch.salon.web.rest;

import ch.salon.domain.*;
import ch.salon.repository.*;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.time.temporal.ChronoField;
import java.time.temporal.ChronoUnit;
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
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

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

    public ImportationResource(
        SalonRepository salonRepository,
        StandRepository standRepository,
        ExponentRepository exponentRepository,
        ConferenceRepository conferenceRepository,
        DimensionStandRepository dimensionStandRepository
    ) {
        this.salonRepository = salonRepository;
        this.standRepository = standRepository;
        this.exponentRepository = exponentRepository;
        this.conferenceRepository = conferenceRepository;
        this.dimensionStandRepository = dimensionStandRepository;
    }

    @PostMapping("")
    public ResponseEntity<Invoice> importation() throws URISyntaxException {
        try (
            Reader reader = new FileReader(
                "E:\\ajoiedumieuxvivre\\src\\main\\java\\ch\\salon\\importation\\formulaire_2024.csv",
                Charset.defaultCharset()
            );
            CSVParser csvParser = new CSVParser(reader, CSVFormat.EXCEL.withDelimiter(';'))
        ) {
            Salon currentSalon = new Salon();
            currentSalon.setStartingDate(Instant.now());
            currentSalon.setEndingDate(Instant.now().plus(1, ChronoUnit.DAYS));
            currentSalon.setPlace("Important : Ajoie de mieux vivre " + currentSalon.getEndingDate().toString());
            currentSalon = salonRepository.save(currentSalon);

            DimensionStand dimension2x2Stand = new DimensionStand();
            dimension2x2Stand.setDimension("2 m x 2 m");
            dimensionStandRepository.save(dimension2x2Stand);
            DimensionStand dimension25x2Stand = new DimensionStand();
            dimension25x2Stand.setDimension("2.5 m x 2 m");
            dimensionStandRepository.save(dimension25x2Stand);
            DimensionStand dimension25Cotex2Stand = new DimensionStand();
            dimension25Cotex2Stand.setDimension("2.5 m x 2 m (possible de vendre des deux côtés)");
            dimensionStandRepository.save(dimension25Cotex2Stand);
            DimensionStand dimension3x2Stand = new DimensionStand();
            dimension3x2Stand.setDimension("3 m x 2 m");
            dimensionStandRepository.save(dimension3x2Stand);
            DimensionStand dimension3x25Stand = new DimensionStand();
            dimension3x25Stand.setDimension("3 m x 2.5 m");
            dimensionStandRepository.save(dimension3x25Stand);
            DimensionStand dimension4x2Stand = new DimensionStand();
            dimension4x2Stand.setDimension("4 m x 2 m");
            dimensionStandRepository.save(dimension4x2Stand);

            List<DimensionStand> dimensionStands = dimensionStandRepository.findAll();

            boolean isFirstLine = true;
            for (CSVRecord csvRecord : csvParser) {
                if (isFirstLine) {
                    isFirstLine = false;

                    continue;
                }

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
                String exponentWebsite = csvRecord.get(EXPONENT_WEBSITE);
                String exponentSocialMedia = csvRecord.get(EXPONENT_SOCIAL_MEDIA);
                String exponentUrlPicture = csvRecord.get(EXPONENT_URL_PICTURE);

                Exponent currentExponent = new Exponent();
                currentExponent.setEmail(sub(exponentEmail));
                currentExponent.setFullName(sub(exponentFullname));
                currentExponent.setAddress(sub(exponentAddress));
                currentExponent.setNpaLocalite(sub(exponentNpaLocalite));
                currentExponent.setPhoneNumber(exponentPhone);
                currentExponent.setWebsite(sub(exponentWebsite));
                currentExponent.setPhoneNumber(exponentPhone);
                currentExponent.setSocialMedia(sub(exponentSocialMedia));
                currentExponent.setUrlPicture(sub(exponentUrlPicture));
                currentExponent = exponentRepository.save(currentExponent);

                String standDescription = csvRecord.get(STAND_DESCRIPTION);
                String standMeal1 = csvRecord.get(STAND_MEAL_1);
                String standMeal2 = csvRecord.get(STAND_MEAL_2);
                String standMeal3 = csvRecord.get(STAND_MEAL_3);
                String standDimension = csvRecord.get(STAND_DIMENSION);
                String standSharing = csvRecord.get(STAND_SHARING);
                String standNbTable = csvRecord.get(STAND_NB_TABLE);
                String standNbChair = csvRecord.get(STAND_NB_CHAIR);
                String standElectricity = csvRecord.get(STAND_ELECTRICITY);
                String standAcceptedContract = csvRecord.get(STAND_ACCEPTED_CONTRACT);
                String standArrangment = csvRecord.get(STAND_ARRANGMENT);
                String standAcceptedChart = csvRecord.get(STAND_ACCEPTED_CHART);

                Stand currentStand = new Stand();
                currentStand.setDescription(sub(standDescription));
                currentStand.setNbMeal1(Long.parseLong(standMeal1.trim()));
                currentStand.setNbMeal2(Long.parseLong(standMeal2.trim()));
                currentStand.setNbMeal3(Long.parseLong(standMeal3.trim()));
                currentStand.setDimension(findDimension(dimensionStands, standDimension));
                currentStand.setShared(standSharing.equalsIgnoreCase("oui"));
                currentStand.setNbTable(standNbTable.contains("Aucune") ? 0 : Long.parseLong(standNbTable.substring(0, 1)));
                currentStand.setNbChair(standNbChair.contains("Aucune") ? 0 : Long.parseLong(standNbChair.substring(0, 1)));
                currentStand.setNeedElectricity(standElectricity.equalsIgnoreCase("oui"));
                currentStand.setAcceptedContract(standAcceptedContract.contains("accepte"));
                currentStand.setNeedArrangment(standArrangment.contains("arrangement"));
                currentStand.setAcceptedChart(standAcceptedChart.contains("accepte"));
                currentStand.setInvoices(new HashSet<>());
                currentStand.setSalon(currentSalon);
                currentStand.setRegistrationDate(Instant.now());
                currentStand.setStatus(StandStatus.IN_TREATMENT);
                currentStand.setBillingClosed(false);
                currentStand.setExponent(currentExponent);
                currentStand = standRepository.save(currentStand);

                String conferenceDescription = csvRecord.get(CONFERENCE_DESCRIPTION);
                String standConference = csvRecord.get(STAND_CONFERENCE);

                if (standConference.contains("oui")) {
                    Conference currentConference = new Conference();
                    currentConference.setSalon(currentSalon);
                    currentConference.setExponent(currentExponent);
                    currentConference.setTitle(sub(conferenceDescription));
                    currentConference = conferenceRepository.save(currentConference);
                }
            }
        } catch (IOException e) {}

        return ResponseEntity.created(new URI("/api/importation")).build();
    }

    private DimensionStand findDimension(List<DimensionStand> dimensions, String dimension) {
        System.out.println(dimension);
        return dimensions.stream().filter(dim -> dimension.contains(dim.getDimension())).findFirst().orElseThrow();
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(250, chaine.length())) : null;
    }
}
