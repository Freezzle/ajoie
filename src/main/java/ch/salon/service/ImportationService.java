package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.DimensionStand;
import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ImportationService {

    private static final Logger log = LoggerFactory.getLogger(ImportationService.class);
    private static final int STAND_REGISTRATION_DATE = 0;
    private static final int EXHIBITOR_EMAIL = 1;
    private static final int EXHIBITOR_FAMILY_NAME = 2;
    private static final int EXHIBITOR_FIRSTNAME = 3;
    private static final int EXHIBITOR_NAME = 4;
    private static final int EXHIBITOR_ADDRESS = 5;
    private static final int EXHIBITOR_NPA_LOCALITE = 6;
    private static final int EXHIBITOR_PHONE_NUMBER = 7;
    private static final int STAND_DESCRIPTION = 8;
    private static final int EXHIBITOR_WEBSITE = 9;
    private static final int STAND_FACEBOOK = 10;
    private static final int STAND_INSTAGRAM = 11;
    private static final int STAND_MEAL_1 = 12;
    private static final int STAND_MEAL_2 = 13;
    private static final int STAND_MEAL_3 = 14;
    private static final int STAND_DIMENSION = 15;
    private static final int STAND_CONFERENCE = 16;
    private static final int CONFERENCE_TITRE = 17;
    private static final int CONFERENCE_DESCRIPTION = 18;
    private static final int STAND_SHARING = 19;
    private static final int STAND_NB_TABLE = 20;
    private static final int STAND_NB_CHAIR = 21;
    private static final int STAND_ELECTRICITY = 22;
    private static final int PARTICIPATION_OFFRE_SOIN = 23;
    private static final int PARTICIPATION_COMPLEMENT = 24;
    private static final int STAND_ACCEPTED_CONTRACT = 25;
    private static final int STAND_ACCEPTED_CHART = 26;
    private static final int EXHIBITOR_URL_PICTURE = 27;
    private final SalonRepository salonRepository;
    private final StandRepository standRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final ConferenceRepository conferenceRepository;
    private final DimensionStandRepository dimensionStandRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanService invoiceService;

    public ImportationService(SalonRepository salonRepository, StandRepository standRepository,
                              ExhibitorRepository exhibitorRepository, ConferenceRepository conferenceRepository,
                              DimensionStandRepository dimensionStandRepository,
                              ParticipationRepository participationRepository,
                              InvoicingPlanService invoicingPlanService) {
        this.salonRepository = salonRepository;
        this.standRepository = standRepository;
        this.exhibitorRepository = exhibitorRepository;
        this.conferenceRepository = conferenceRepository;
        this.dimensionStandRepository = dimensionStandRepository;
        this.participationRepository = participationRepository;
        this.invoiceService = invoicingPlanService;
    }

    public void importData(String idSalon, InputStream file) {
        try (Reader reader = new InputStreamReader(file, StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader,
                                                 CSVFormat.EXCEL.withDelimiter(',').withFirstRecordAsHeader())) {

            Salon currentSalon = salonRepository.findById(UUID.fromString(idSalon)).orElseThrow();
            List<DimensionStand> dimensionStands = dimensionStandRepository.findAll();

            for (CSVRecord csvRecord : csvParser) {
                String standRegistrationDate = csvRecord.get(STAND_REGISTRATION_DATE);

                if (StringUtils.isBlank(standRegistrationDate)) {
                    break;
                }

                String exhibitorEmail = sanitize(csvRecord, EXHIBITOR_EMAIL, true, false, false, true);
                String exhibitorFamilyName = sanitize(csvRecord, EXHIBITOR_FAMILY_NAME, true, true, true, true);
                String exhibitorFirstName = sanitize(csvRecord, EXHIBITOR_FIRSTNAME, true, true, true, true);
                String exhibitorAddress = sanitize(csvRecord, EXHIBITOR_ADDRESS, true, true, false, true);
                String exhibitorNpaLocalite = sanitize(csvRecord, EXHIBITOR_NPA_LOCALITE, true, true, true, true);
                String exhibitorPhone = sanitize(csvRecord, EXHIBITOR_PHONE_NUMBER, false, false, false, true);

                if (participationRepository.findByExhibitorEmailAndSalonId(exhibitorEmail, currentSalon.getId()) !=
                    null) {
                    log.info("registration already passed through with email {} and salon {}", exhibitorEmail,
                             currentSalon.getId());
                    continue;
                }

                Exhibitor currentExhibitor = exhibitorRepository.findByEmail(exhibitorEmail);
                if (currentExhibitor == null) {
                    currentExhibitor = new Exhibitor();
                    currentExhibitor.setRegistrationDate(Instant.now());
                    currentExhibitor.setEmail(sub100(exhibitorEmail));
                    currentExhibitor.setFullName(sub100(exhibitorFirstName + " " + exhibitorFamilyName));
                    currentExhibitor.setAddress(sub100(exhibitorAddress));
                    currentExhibitor.setNpaLocalite(sub100(exhibitorNpaLocalite));
                    currentExhibitor.setPhoneNumber(exhibitorPhone);
                    currentExhibitor.setLanguage(Locale.FRENCH.getLanguage());
                    currentExhibitor.setExtraInformation(null);
                    currentExhibitor = exhibitorRepository.save(currentExhibitor);
                }

                String participationName = sanitize(csvRecord, EXHIBITOR_NAME, false, true, false, true);
                String participationMeal1 = sanitize(csvRecord, STAND_MEAL_1, false, false, false, true);
                String participationMeal2 = sanitize(csvRecord, STAND_MEAL_2, false, false, false, true);
                String participationMeal3 = sanitize(csvRecord, STAND_MEAL_3, false, false, false, true);
                String contract = sanitize(csvRecord, STAND_ACCEPTED_CONTRACT, true, false, false, true);
                String chart = sanitize(csvRecord, STAND_ACCEPTED_CHART, true, false, false, true);
                String participationAdditionnal =
                    sanitize(csvRecord, PARTICIPATION_COMPLEMENT, false, true, false, true);
                String participationOffer = sanitize(csvRecord, PARTICIPATION_OFFRE_SOIN, false, true, false, true);

                Participation currentParticipation = new Participation();
                currentParticipation.setClientNumber(Participation.incrementClientNumber(
                    participationRepository.findMaxClientNumber(currentSalon.getId()),
                    currentSalon.getReferenceNumber()));

                currentParticipation.setSalon(currentSalon);
                currentParticipation.setExhibitor(currentExhibitor);
                currentParticipation.setTherapistName(sub100(participationName));
                currentParticipation.setNbMeal1(Long.parseLong(participationMeal1.trim()));
                currentParticipation.setNbMeal2(Long.parseLong(participationMeal2.trim()));
                currentParticipation.setNbMeal3(Long.parseLong(participationMeal3.trim()));
                currentParticipation.setAcceptedContract(contract.contains("accepte"));
                currentParticipation.setAdditionnalInformation(participationAdditionnal);
                currentParticipation.setHasOffer(participationOffer.equalsIgnoreCase("oui"));
                currentParticipation.setOffer(null);
                currentParticipation.setCrushOfHeart(false);
                currentParticipation.setGuestOfHonor(false);
                currentParticipation.setAcceptedChart(chart.contains("accepte"));

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
                LocalDateTime localDateTime = LocalDateTime.parse(standRegistrationDate, formatter);
                currentParticipation.setRegistrationDate(localDateTime.toInstant(ZoneOffset.UTC));
                currentParticipation.setStatus(Status.IN_VERIFICATION);
                currentParticipation.setNeedArrangement(false);
                currentParticipation.setExtraInformation(null);

                String standDescription = sanitize(csvRecord, STAND_DESCRIPTION, false, true, false, true);
                String standDimension = sanitize(csvRecord, STAND_DIMENSION, false, false, false, true);
                String standSharing = sanitize(csvRecord, STAND_SHARING, true, false, false, true);
                String standNbTable = sanitize(csvRecord, STAND_NB_TABLE, false, false, false, true);
                String standNbChair = sanitize(csvRecord, STAND_NB_CHAIR, false, false, false, true);
                String standElectricity = sanitize(csvRecord, STAND_ELECTRICITY, true, false, false, true);
                String standWebsite = sanitize(csvRecord, EXHIBITOR_WEBSITE, true, false, false, true);
                String standInstagram = sanitize(csvRecord, STAND_INSTAGRAM, true, false, false, true);
                String standFacebook = sanitize(csvRecord, STAND_FACEBOOK, true, false, false, true);

                String standUrlPicture = sanitize(csvRecord, EXHIBITOR_URL_PICTURE, false, false, false, true);

                Stand currentStand = new Stand();
                currentStand.setRegistrationDate(Instant.now());
                currentStand.setParticipation(currentParticipation);
                currentStand.setDescription(sub500(standDescription));
                currentStand.setWebsite(sub100(standWebsite));
                currentStand.setInstagram(sub100(standInstagram));
                currentStand.setFacebook(sub100(standFacebook));
                currentStand.setUrlPicture(sub500(standUrlPicture));
                currentStand.setDimension(findDimension(dimensionStands, standDimension));
                currentStand.setShared(standSharing.equalsIgnoreCase("oui"));
                currentStand.setNbTable(standNbTable.contains("Aucune") ? 0 : Long.parseLong(
                    standNbTable.replaceAll("\"", "").substring(0, 1)));
                currentStand.setNbChair(standNbChair.contains("Aucune") ? 0 : Long.parseLong(
                    standNbChair.replaceAll("\"", "").substring(0, 1)));
                currentStand.setNeedElectricity(standElectricity.contains("oui"));
                currentStand.setStatus(Status.IN_VERIFICATION);
                currentStand.setExtraInformation(null);
                standRepository.save(currentStand);

                String conferenceTitre = sanitize(csvRecord, CONFERENCE_TITRE, false, true, false, true);
                String conferenceDescription = sanitize(csvRecord, CONFERENCE_DESCRIPTION, false, true, false, true);
                String standConference = sanitize(csvRecord, STAND_CONFERENCE, true, false, false, true);

                if (standConference.contains("oui")) {
                    Conference currentConference = new Conference();
                    currentConference.setRegistrationDate(Instant.now());
                    currentConference.setParticipation(currentParticipation);
                    currentConference.setTitle(sub500(conferenceTitre));
                    currentConference.setDescription(sub500(conferenceDescription));
                    currentConference.setStatus(Status.IN_VERIFICATION);
                    conferenceRepository.save(currentConference);
                }

                currentParticipation = participationRepository.save(currentParticipation);

                invoiceService.refreshInvoicingPlans(currentParticipation.getId().toString());
            }
        } catch (IOException e) {
            throw new IllegalStateException("Problem occured !");
        }
    }

    private DimensionStand findDimension(List<DimensionStand> dimensions, String dimension) {
        return dimensions.stream().filter(dim -> dimension.contains(dim.getDimension())).findFirst().orElseGet(() -> {
            DimensionStand newDimensionStand = new DimensionStand();
            newDimensionStand.setDimension(sub100(dimension));
            DimensionStand saved = dimensionStandRepository.save(newDimensionStand);
            dimensions.add(saved);
            return saved;
        });
    }

    private String sub100(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(100, chaine.length())) : null;
    }

    private String sub500(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(500, chaine.length())) : null;
    }

    private String sanitize(CSVRecord csvRecord, int position, boolean lowercase, boolean capitalFirstLetter,
                            boolean capitalEachFirstLetter, boolean removeQuote) {
        String valueFound = csvRecord.get(position);
        if (valueFound == null || valueFound.isBlank()) {
            return valueFound;
        }

        if (removeQuote) {
            valueFound = valueFound.replaceAll("\"", "");
        }

        if (lowercase) {
            valueFound = valueFound.toLowerCase();
        }

        if (capitalFirstLetter) {
            valueFound = valueFound.substring(0, 1).toUpperCase() + valueFound.substring(1);
        }

        if (capitalEachFirstLetter) {
            valueFound = Arrays.stream(valueFound.split("\\s+"))
                               .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1))
                               .collect(Collectors.joining(" "));
        }

        return valueFound;
    }
}
