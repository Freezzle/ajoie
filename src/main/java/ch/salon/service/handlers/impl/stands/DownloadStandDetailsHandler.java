package ch.salon.service.handlers.impl.stands;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DownloadStandDetailsHandler implements DocumentActionHandler<Salon>, ActionMetadataProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(DownloadStandDetailsHandler.class.getName());
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DocumentCreator documentCreator;
    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final FloorPlanSalonRepository floorPlanSalonRepository;
    private final PlanningTalksSalonRepository planningTalksSalonRepository;
    private final PriceStandSalonRepository priceStandSalonRepository;
    private final ObjectMapper objectMapper;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }

        // Vérifier qu'au moins un floor plan existe
        List<FloorPlanSalon> floorPlans = floorPlanSalonRepository.findBySalonIdOrderByPosition(payload.getId());
        boolean isAllowed = !floorPlans.isEmpty();

        return ActionSupport.fromConditions("action.stands-detail-download.help",
            ConditionalKey.of(isAllowed, "action.stands-detail-download.condition.floor-plan-exists"));
    }

    @Override
    public InputStreamSource download(Salon payload, Map<String, Object> context) throws IOException {
        Context thymeleafCtxt = new Context(Locale.FRENCH);

        UUID salonId = payload.getId();

        // Charger tous les stands (filtrer CANCELLED et REFUSED)
        List<Stand> allStands = standRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(salonId);
        List<Stand> validStands = allStands.stream()
                .filter(s -> s.getStatus() != Status.CANCELED && s.getStatus() != Status.REFUSED)
                .toList();

        // Charger les conférences et ateliers (filtrer CANCELLED et REFUSED)
        List<Conference> allConferences = conferenceRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(salonId);
        List<Conference> validConferences = allConferences.stream()
                .filter(c -> c.getStatus() != Status.CANCELED && c.getStatus() != Status.REFUSED)
                .toList();

        List<Workshop> allWorkshops = workshopRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(salonId);
        List<Workshop> validWorkshops = allWorkshops.stream()
                .filter(w -> w.getStatus() != Status.CANCELED && w.getStatus() != Status.REFUSED)
                .toList();

        // Créer des maps par participationId
        Map<UUID, List<Conference>> conferencesByParticipation = validConferences.stream()
                .collect(Collectors.groupingBy(c -> c.getParticipation().getId()));

        Map<UUID, List<Workshop>> workshopsByParticipation = validWorkshops.stream()
                .collect(Collectors.groupingBy(w -> w.getParticipation().getId()));

        // Charger le planning des talks pour obtenir les horaires
        PlanningTalksSalon talkPlanning = planningTalksSalonRepository.findBySalonId(salonId);
        Map<String, TalkScheduleInfo> talkSchedules = extractTalkSchedules(talkPlanning);

        // Charger les floor plans
        List<FloorPlanSalon> floorPlans = floorPlanSalonRepository.findBySalonIdOrderByPosition(salonId);

        // Mapper les stands avec leurs informations de position depuis les floor plans
        Map<UUID, StandPositionInfo> standPositions = extractStandPositions(floorPlans);

        // Construire les données des pages
        List<StandPageData> pages = buildStandPages(validStands, standPositions,
                conferencesByParticipation, workshopsByParticipation, talkSchedules);

        // Trier par position (null à la fin)
        pages.sort((a, b) -> {
            if (a.getPosition() == null && b.getPosition() == null) {
                return a.getTherapistName().compareTo(b.getTherapistName());
            }
            if (a.getPosition() == null) return 1;
            if (b.getPosition() == null) return -1;
            return Integer.compare(a.getPosition(), b.getPosition());
        });

        thymeleafCtxt.setVariable("pages", pages);

        return this.documentCreator.build("stands-detail", thymeleafCtxt);
    }

    private Map<UUID, StandPositionInfo> extractStandPositions(List<FloorPlanSalon> floorPlans) {
        Map<UUID, StandPositionInfo> result = new HashMap<>();

        // Charger toutes les dimensions pour éviter des requêtes multiples
        Map<String, String> dimensionLabels = new HashMap<>();
        if (!floorPlans.isEmpty()) {
            UUID salonId = floorPlans.get(0).getSalon().getId();
            List<PriceStandSalon> dimensions = priceStandSalonRepository.findBySalonId(salonId);
            for (PriceStandSalon dimension : dimensions) {
                dimensionLabels.put(dimension.getId().toString(), dimension.getDimension());
            }
        }

        for (FloorPlanSalon floorPlan : floorPlans) {
            if (floorPlan.getData() == null) {
                continue;
            }

            try {
                JsonNode rootNode = objectMapper.readTree(floorPlan.getData());
                JsonNode cellsNode = rootNode.get("cells");

                if (cellsNode != null && cellsNode.isArray()) {
                    for (JsonNode rowNode : cellsNode) {
                        if (rowNode.isArray()) {
                            for (JsonNode cellNode : rowNode) {
                                JsonNode dimensionNode = cellNode.get("dimension");
                                if (dimensionNode != null && !dimensionNode.isNull()) {
                                    JsonNode standNode = dimensionNode.get("stand");
                                    if (standNode != null && !standNode.isNull()) {
                                        JsonNode standIdNode = standNode.get("id");
                                        JsonNode positionNode = dimensionNode.get("position");
                                        JsonNode idDimensionNode = dimensionNode.get("idDimension");

                                        if (standIdNode != null && !standIdNode.isNull()) {
                                            UUID standId = UUID.fromString(standIdNode.asText());
                                            Integer position = positionNode != null && !positionNode.isNull()
                                                    ? positionNode.asInt()
                                                    : null;

                                            // Récupérer le label de dimension depuis la map
                                            String dimensionLabel = null;
                                            if (idDimensionNode != null && !idDimensionNode.isNull()) {
                                                dimensionLabel = dimensionLabels.get(idDimensionNode.asText());
                                            }

                                            result.put(standId, new StandPositionInfo(floorPlan.getName(), position, dimensionLabel));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                LOGGER.warn("Error parsing floor plan data for plan {}: {}", floorPlan.getId(), e.getMessage());
            }
        }

        return result;
    }

    private Map<String, TalkScheduleInfo> extractTalkSchedules(PlanningTalksSalon planning) {
        Map<String, TalkScheduleInfo> result = new HashMap<>();

        if (planning == null || planning.getConfiguration() == null || planning.getTalks() == null) {
            return result;
        }

        TimelineData configuration = planning.getConfiguration();
        int intervalMinutes = configuration.getIntervalMinutes();

        // Créer une map des rooms pour obtenir les labels
        Map<String, String> roomLabels = configuration.getRooms().stream()
                .collect(Collectors.toMap(TimelineRoom::getId, TimelineRoom::getLabel));

        // Parcourir les talks programmés
        for (TalkPlanning talk : planning.getTalks()) {
            if (talk.getRoomId() == null || talk.getDayId() == null) {
                continue;
            }

            // Trouver le jour correspondant
            TimelineDay day = configuration.getDays().stream()
                    .filter(d -> d.getId().equals(talk.getDayId()))
                    .findFirst()
                    .orElse(null);

            if (day == null) {
                continue;
            }

            // Trouver la room data pour ce jour
            TimelineRoomData roomData = day.getRooms().stream()
                    .filter(r -> r.getRoomId().equals(talk.getRoomId()))
                    .findFirst()
                    .orElse(null);

            if (roomData == null) {
                continue;
            }

            // Calculer l'heure de début
            Instant startTime = roomData.getStartingHour().plusSeconds((long) talk.getStartSlot() * intervalMinutes * 60);

            String dayLabel = day.getLabel();
            String roomLabel = roomLabels.getOrDefault(talk.getRoomId(), talk.getRoomId());
            String timeFormatted = TIME_FORMATTER.format(startTime.atZone(ZoneId.of("Europe/Paris")));
            String dateFormatted = DATE_FORMATTER.format(startTime.atZone(ZoneId.of("Europe/Paris")));

            // Créer la clé unique: type:id
            String key = talk.getType().name() + ":" + talk.getId();
            result.put(key, new TalkScheduleInfo(dayLabel, dateFormatted, timeFormatted, roomLabel));
        }

        return result;
    }

    private List<StandPageData> buildStandPages(
            List<Stand> stands,
            Map<UUID, StandPositionInfo> standPositions,
            Map<UUID, List<Conference>> conferencesByParticipation,
            Map<UUID, List<Workshop>> workshopsByParticipation,
            Map<String, TalkScheduleInfo> talkSchedules) {

        List<StandPageData> pages = new ArrayList<>();

        for (Stand stand : stands) {
            StandPageData page = new StandPageData();

            Participation participation = stand.getParticipation();

            // Informations de base
            page.setTherapistName(participation.getTherapistName());
            page.setExhibitorFullName(participation.getExhibitor().getFullname());

            // Repas
            page.setNbMealSaturdayNoon(participation.getNbMeal1() != null ? participation.getNbMeal1().intValue() : 0);
            page.setNbMealSaturdayEvening(participation.getNbMeal2() != null ? participation.getNbMeal2().intValue() : 0);
            page.setNbMealSundayNoon(participation.getNbMeal3() != null ? participation.getNbMeal3().intValue() : 0);

            // Position du stand
            StandPositionInfo posInfo = standPositions.get(stand.getId());
            if (posInfo != null) {
                page.setPlanName(posInfo.getPlanName());
                page.setPosition(posInfo.getPosition());
                page.setPositionFormatted(formatPosition(posInfo.getPlanName(), posInfo.getPosition()));
            }

            // Liste des stands pour ce participant (peut avoir plusieurs stands)
            List<StandInfo> standInfoList = new ArrayList<>();
            StandInfo standInfo = new StandInfo();
            standInfo.setPositionFormatted(page.getPositionFormatted());
            standInfo.setNbTable(stand.getNbTable() != null ? stand.getNbTable().intValue() : 0);
            standInfo.setNbChair(stand.getNbChair() != null ? stand.getNbChair().intValue() : 0);
            standInfo.setNeedElectricity(stand.getNeedElectricity() != null && stand.getNeedElectricity());
            standInfo.setShared(stand.getShared() != null && stand.getShared());

            // Dimension de la participation
            if (stand.getDimension() != null) {
                PriceStandSalon dimension = stand.getDimension();
                standInfo.setDimensionLabel(dimension.getDimension());
            }

            // Dimension sur le plan de salle (depuis StandPositionInfo)
            if (posInfo != null && posInfo.getDimensionLabel() != null) {
                standInfo.setDimensionFloorLabel(posInfo.getDimensionLabel());
            }

            standInfoList.add(standInfo);
            page.setStands(standInfoList);

            // Liste des conférences pour ce participant
            List<Conference> conferences = conferencesByParticipation.get(participation.getId());
            if (conferences != null && !conferences.isEmpty()) {
                List<ConferenceInfo> conferenceInfoList = conferences.stream()
                        .map(conf -> {
                            ConferenceInfo info = new ConferenceInfo();
                            info.setTitle(conf.getTitle());

                            // Récupérer l'horaire depuis le planning
                            String key = "CONFERENCE:" + conf.getId().toString();
                            TalkScheduleInfo schedule = talkSchedules.get(key);
                            if (schedule != null) {
                                info.setDayLabel(schedule.getDayLabel());
                                info.setTime(schedule.getTime());
                                info.setRoomLabel(schedule.getRoomLabel());
                            }

                            return info;
                        })
                        .toList();
                page.setConferences(conferenceInfoList);
            }

            // Liste des ateliers pour ce participant
            List<Workshop> workshops = workshopsByParticipation.get(participation.getId());
            if (workshops != null && !workshops.isEmpty()) {
                List<WorkshopInfo> workshopInfoList = workshops.stream()
                        .map(work -> {
                            WorkshopInfo info = new WorkshopInfo();
                            info.setTitle(work.getTitle());

                            // Récupérer l'horaire depuis le planning
                            String key = "WORKSHOP:" + work.getId().toString();
                            TalkScheduleInfo schedule = talkSchedules.get(key);
                            if (schedule != null) {
                                info.setDayLabel(schedule.getDayLabel());
                                info.setTime(schedule.getTime());
                                info.setRoomLabel(schedule.getRoomLabel());
                            }

                            return info;
                        })
                        .toList();
                page.setWorkshops(workshopInfoList);
            }

            pages.add(page);
        }

        return pages;
    }

    private String formatPosition(String planName, Integer position) {
        if (position == null) {
            return planName + " - Stand n°XXX";
        }
        return planName + " - Stand n°" + position;
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.STANDS_DETAIL_DOWNLOAD;
    }

    @Override
    public String getFilename(Salon payload, Map<String, Object> context) {
        String salonPlace = payload.getPlace().replaceAll("[^a-zA-Z0-9]", "_");
        return "Details_Stands_" + salonPlace + ".pdf";
    }

    // Classes internes pour les données
    @Data
    private static class StandPositionInfo {
        private final String planName;
        private final Integer position;
        private final String dimensionLabel; // Label de dimension sur le floor plan
    }

    @Data
    private static class TalkScheduleInfo {
        private final String dayLabel;
        private final String date;
        private final String time;
        private final String roomLabel;
    }

    @Data
    public static class StandPageData {
        private String therapistName;
        private String exhibitorFullName;

        // Repas
        private int nbMealSaturdayNoon;
        private int nbMealSaturdayEvening;
        private int nbMealSundayNoon;

        // Position (pour le tri)
        private String planName;
        private Integer position;
        private String positionFormatted;

        // Listes
        private List<StandInfo> stands = new ArrayList<>();
        private List<ConferenceInfo> conferences = new ArrayList<>();
        private List<WorkshopInfo> workshops = new ArrayList<>();
    }

    @Data
    public static class StandInfo {
        private String positionFormatted;
        private int nbTable;
        private int nbChair;
        private boolean needElectricity;
        private String dimensionLabel;  // Dimension de la participation
        private String dimensionFloorLabel;  // Dimension sur le plan de salle
        private boolean shared;
    }

    @Data
    public static class ConferenceInfo {
        private String title;
        private String dayLabel;
        private String time;
        private String roomLabel;
    }

    @Data
    public static class WorkshopInfo {
        private String title;
        private String dayLabel;
        private String time;
        private String roomLabel;
    }
}
