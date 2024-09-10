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
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ImportationDataService {

    private static final Logger log = LoggerFactory.getLogger(ImportationDataService.class);
    private static final int STAND_REGISTRATION_DATE = 0;
    private static final int EXHIBITOR_EMAIL = 1;
    private static final int EXHIBITOR_FULL_NAME = 2;
    private static final int EXHIBITOR_ADDRESS = 3;
    private static final int EXHIBITOR_NPA_LOCALITE = 4;
    private static final int EXHIBITOR_PHONE_NUMBER = 5;
    private static final int STAND_DESCRIPTION = 6;
    private static final int EXHIBITOR_WEBSITE = 7;
    private static final int EXHIBITOR_SOCIAL_MEDIA = 8;
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
    private static final int EXHIBITOR_URL_PICTURE = 21;
    private final SalonRepository salonRepository;
    private final StandRepository standRepository;
    private final ExhibitorRepository exhibitorRepository;
    private final ConferenceRepository conferenceRepository;
    private final DimensionStandRepository dimensionStandRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanService invoiceService;

    public ImportationDataService(
        SalonRepository salonRepository,
        StandRepository standRepository,
        ExhibitorRepository exhibitorRepository,
        ConferenceRepository conferenceRepository,
        DimensionStandRepository dimensionStandRepository,
        ParticipationRepository participationRepository,
        InvoicingPlanService invoicingPlanService
    ) {
        this.salonRepository = salonRepository;
        this.standRepository = standRepository;
        this.exhibitorRepository = exhibitorRepository;
        this.conferenceRepository = conferenceRepository;
        this.dimensionStandRepository = dimensionStandRepository;
        this.participationRepository = participationRepository;
        this.invoiceService = invoicingPlanService;
    }

    public void importData(String idSalon) {
        try (
            Reader reader = new FileReader(
                "C:\\Projects\\ajoie\\src\\main\\java\\ch\\salon\\importation\\formulaire_2024.csv",
                Charset.defaultCharset()
            );
            CSVParser csvParser = new CSVParser(reader, CSVFormat.EXCEL.withDelimiter(';'))
        ) {
            Salon currentSalon = salonRepository.findById(UUID.fromString(idSalon)).orElseThrow();

            List<DimensionStand> dimensionStands = dimensionStandRepository.findAll();

            int index = 0;
            for (CSVRecord csvRecord : csvParser) {
                System.out.println(index);
                if (index == 0) {
                    index++;
                    continue;
                }

                String standRegistrationDate = csvRecord.get(STAND_REGISTRATION_DATE);
                // To stop the process
                if (StringUtils.isBlank(standRegistrationDate)) {
                    break;
                }

                String exhibitorEmail = csvRecord.get(EXHIBITOR_EMAIL).replaceAll("\"", "");
                String exhibitorFullname = csvRecord.get(EXHIBITOR_FULL_NAME).replaceAll("\"", "");
                String exhibitorAddress = csvRecord.get(EXHIBITOR_ADDRESS).replaceAll("\"", "");
                String exhibitorNpaLocalite = csvRecord.get(EXHIBITOR_NPA_LOCALITE).replaceAll("\"", "");
                String exhibitorPhone = csvRecord.get(EXHIBITOR_PHONE_NUMBER).replaceAll("\"", "");

                if (participationRepository.findByExhibitorEmailAndSalonId(exhibitorEmail, currentSalon.getId()) != null) {
                    log.info("registration already passed through with email {} and salon {}", exhibitorEmail, currentSalon.getId());
                    continue;
                }

                Exhibitor currentExhibitor = exhibitorRepository.findByEmail(exhibitorEmail);
                if (currentExhibitor == null) {
                    currentExhibitor = new Exhibitor();
                    currentExhibitor.setEmail(sub(exhibitorEmail));
                    currentExhibitor.setFullName(sub(exhibitorFullname));
                    currentExhibitor.setAddress(sub(exhibitorAddress));
                    currentExhibitor.setNpaLocalite(sub(exhibitorNpaLocalite));
                    currentExhibitor.setPhoneNumber(exhibitorPhone);
                    currentExhibitor = exhibitorRepository.save(currentExhibitor);
                }

                String participationMeal1 = csvRecord.get(STAND_MEAL_1).replaceAll("\"", "");
                String participationMeal2 = csvRecord.get(STAND_MEAL_2).replaceAll("\"", "");
                String participationMeal3 = csvRecord.get(STAND_MEAL_3).replaceAll("\"", "");
                String participationAcceptedContract = csvRecord.get(STAND_ACCEPTED_CONTRACT).replaceAll("\"", "");
                String participationArrangment = csvRecord.get(STAND_ARRANGMENT).replaceAll("\"", "");
                String participationAcceptedChart = csvRecord.get(STAND_ACCEPTED_CHART).replaceAll("\"", "");

                Participation currentParticipation = new Participation();
                currentParticipation.setClientNumber(
                    ParticipationService.getClientNumber(
                        participationRepository.findMaxClientNumber(currentSalon.getId()),
                        currentSalon.getReferenceNumber()
                    )
                );
                currentParticipation.setSalon(currentSalon);
                currentParticipation.setExhibitor(currentExhibitor);
                currentParticipation.setNbMeal1(Long.parseLong(participationMeal1.trim().replaceAll("\"", "")));
                currentParticipation.setNbMeal2(Long.parseLong(participationMeal2.trim().replaceAll("\"", "")));
                currentParticipation.setNbMeal3(Long.parseLong(participationMeal3.trim().replaceAll("\"", "")));
                currentParticipation.setAcceptedContract(participationAcceptedContract.contains("accepte"));
                currentParticipation.setNeedArrangment(participationArrangment.contains("arrangement"));
                currentParticipation.setAcceptedChart(participationAcceptedChart.contains("accepte"));
                currentParticipation.setRegistrationDate(Instant.now()); // FIXME : Take registration date
                currentParticipation.setStatus(Status.IN_VERIFICATION);
                currentParticipation.setIsBillingClosed(false);

                String standDescription = csvRecord.get(STAND_DESCRIPTION).replaceAll("\"", "");
                String standDimension = csvRecord.get(STAND_DIMENSION).replaceAll("\"", "");
                String standSharing = csvRecord.get(STAND_SHARING).replaceAll("\"", "");
                String standNbTable = csvRecord.get(STAND_NB_TABLE).replaceAll("\"", "");
                String standNbChair = csvRecord.get(STAND_NB_CHAIR).replaceAll("\"", "");
                String standElectricity = csvRecord.get(STAND_ELECTRICITY).replaceAll("\"", "");
                String standWebsite = csvRecord.get(EXHIBITOR_WEBSITE).replaceAll("\"", "");
                String standSocialMedia = csvRecord.get(EXHIBITOR_SOCIAL_MEDIA).replaceAll("\"", "");
                String standUrlPicture = csvRecord.get(EXHIBITOR_URL_PICTURE).replaceAll("\"", "");

                Stand currentStand = new Stand();
                currentStand.setParticipation(currentParticipation);
                currentStand.setDescription(sub(standDescription));
                currentStand.setWebsite(sub(standWebsite));
                currentStand.setSocialMedia(sub(standSocialMedia));
                currentStand.setUrlPicture(sub(standUrlPicture));
                currentStand.setDimension(findDimension(dimensionStands, standDimension));
                currentStand.setShared(standSharing.equalsIgnoreCase("oui"));
                currentStand.setNbTable(
                    standNbTable.contains("Aucune") ? 0 : Long.parseLong(standNbTable.replaceAll("\"", "").substring(0, 1))
                );
                currentStand.setNbChair(
                    standNbChair.contains("Aucune") ? 0 : Long.parseLong(standNbChair.replaceAll("\"", "").substring(0, 1))
                );
                currentStand.setNeedElectricity(standElectricity.equalsIgnoreCase("oui"));
                currentStand.setStatus(Status.IN_VERIFICATION);
                standRepository.save(currentStand);

                String conferenceDescription = csvRecord.get(CONFERENCE_DESCRIPTION).replaceAll("\"", "");
                String standConference = csvRecord.get(STAND_CONFERENCE).replaceAll("\"", "");

                if (standConference.equalsIgnoreCase("oui")) {
                    Conference currentConference = new Conference();
                    currentConference.setParticipation(currentParticipation);
                    currentConference.setTitle(sub(conferenceDescription));
                    currentConference.setStatus(Status.IN_VERIFICATION);
                    conferenceRepository.save(currentConference);
                }

                currentParticipation = participationRepository.save(currentParticipation);

                invoiceService.refreshInvoicingPlans(currentParticipation.getId().toString());
                index++;
            }
        } catch (IOException e) {}
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

    private String incrementClientNumber(Long referenceSalon, String clientNumber) {
        int number = 100;
        if (clientNumber != null) {
            String[] split = clientNumber.split("-");
            number = Integer.parseInt(split[split.length - 1]);
        }

        // Incrémenter le nombre
        number = number + 1;

        // Reformater le numéro incrémenté avec le même nombre de chiffres
        return referenceSalon + "-" + String.format("%03d", number);
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(250, chaine.length())) : null;
    }
}
