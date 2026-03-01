package ch.salon.service.handlers.impl.talks;

import ch.salon.domain.Conference;
import ch.salon.domain.PlanningTalksSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.TalkPlanning;
import ch.salon.domain.TimelineDay;
import ch.salon.domain.TimelineRoom;
import ch.salon.domain.TimelineRoomData;
import ch.salon.domain.Workshop;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.PlanningTalksSalonRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DownloadTalksPlanningHandler implements DocumentActionHandler<Salon>, ActionMetadataProvider {
    private static final Logger LOGGER = LoggerFactory.getLogger(DownloadTalksPlanningHandler.class.getName());
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final DocumentCreator documentCreator;
    private final PlanningTalksSalonRepository planningTalksSalonRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }

        // Load the planning to check if it exists
        PlanningTalksSalon planning = planningTalksSalonRepository.findBySalonId(payload.getId());
        boolean isAllowed = planning != null && planning.getConfiguration() != null
                && !planning.getConfiguration().getDays().isEmpty()
                && !planning.getConfiguration().getRooms().isEmpty();

        return ActionSupport.fromConditions("action.talks-planning-download.help", ConditionalKey.of(isAllowed, "action.talks-planning-download.condition.configuration-filled"));
    }

    @Override
    public InputStreamSource download(Salon payload, Map<String, Object> context) throws IOException {
        Context thymeleafCtxt = new Context(Locale.FRENCH);

        UUID salonId = payload.getId();

        // Load the planning from repository
        PlanningTalksSalon planning = planningTalksSalonRepository.findBySalonId(salonId);
        if (planning == null || planning.getConfiguration() == null) {
            throw new IllegalStateException("No planning found for salon: " + salonId);
        }

        // Load all conferences and workshops for the salon
        List<Conference> conferences = conferenceRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(salonId);
        List<Workshop> workshops = workshopRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(salonId);

        // Create maps for quick lookup
        Map<String, Conference> conferenceMap = conferences.stream()
                .collect(Collectors.toMap(c -> c.getId().toString(), c -> c));
        Map<String, Workshop> workshopMap = workshops.stream()
                .collect(Collectors.toMap(w -> w.getId().toString(), w -> w));

        // Build pages data: one page per day/room combination
        List<PageData> pages = buildPages(planning, conferenceMap, workshopMap);

        thymeleafCtxt.setVariable("pages", pages);

        return this.documentCreator.build("talks-planning", thymeleafCtxt);
    }

    private List<PageData> buildPages(PlanningTalksSalon planning,
                                     Map<String, Conference> conferenceMap,
                                     Map<String, Workshop> workshopMap) {
        List<PageData> pages = new ArrayList<>();

        var configuration = planning.getConfiguration();
        if (configuration == null || configuration.getDays().isEmpty()) {
            return pages;
        }

        int intervalMinutes = configuration.getIntervalMinutes();

        // Sort days by their natural order (could be parsed from label if needed)
        List<TimelineDay> sortedDays = new ArrayList<>(configuration.getDays());

        // For each day, for each room, create a page
        for (TimelineDay day : sortedDays) {
            for (TimelineRoomData roomData : day.getRooms()) {
                String roomId = roomData.getRoomId();

                // Find room label
                String roomLabel = configuration.getRooms().stream()
                        .filter(r -> r.getId().equals(roomId))
                        .map(TimelineRoom::getLabel)
                        .findFirst()
                        .orElse(roomId);

                // Filter talks for this day and room
                List<TalkPlanning> talksForRoom = planning.getTalks().stream()
                        .filter(t -> day.getId().equals(t.getDayId()) && roomId.equals(t.getRoomId()))
                        .sorted(Comparator.comparingInt(TalkPlanning::getStartSlot))
                        .toList();

                // Build TalkData list
                List<TalkData> talkDataList = new ArrayList<>();
                for (TalkPlanning talk : talksForRoom) {
                    TalkData talkData = buildTalkData(talk, conferenceMap, workshopMap,
                                                      roomData.getStartingHour(), intervalMinutes);
                    if (talkData != null) {
                        talkDataList.add(talkData);
                    }
                }

                // Create page even if no talks (as per requirements)
                PageData page = new PageData();
                page.setDayLabel(day.getLabel());
                page.setRoomLabel(roomLabel);
                page.setTalks(talkDataList);
                pages.add(page);
            }
        }

        return pages;
    }

    private TalkData buildTalkData(TalkPlanning talk,
                                   Map<String, Conference> conferenceMap,
                                   Map<String, Workshop> workshopMap,
                                   Instant roomStartTime,
                                   int intervalMinutes) {
        TalkData data = new TalkData();

        // Calculate start time
        Instant startTime = roomStartTime.plusSeconds((long) talk.getStartSlot() * intervalMinutes * 60);
        data.setStartTime(TIME_FORMATTER.format(startTime.atZone(ZoneId.of("Europe/Paris"))));

        // Get details from Conference or Workshop
        if (talk.getType() == TalkPlanning.TalkType.CONFERENCE) {
            Conference conf = conferenceMap.get(talk.getId());
            if (conf != null) {
                data.setTitle(conf.getTitle());
                data.setDescription(conf.getDescription());
                data.setTherapistName(conf.getParticipation().getTherapistName());
                data.setExhibitorFullName(conf.getParticipation().getExhibitor().getFullname());
                data.setDuration(talk.getDurationTalkMinutes() + " minutes");
            } else {
                LOGGER.warn("Conference not found: {}", talk.getId());
                return null;
            }
        } else if (talk.getType() == TalkPlanning.TalkType.WORKSHOP) {
            Workshop work = workshopMap.get(talk.getId());
            if (work != null) {
                data.setTitle(work.getTitle());
                data.setDescription(work.getDescription());
                data.setTherapistName(work.getParticipation().getTherapistName());
                data.setExhibitorFullName(work.getParticipation().getExhibitor().getFullname());
                data.setDuration(talk.getDurationTalkMinutes() + " minutes");
            } else {
                LOGGER.warn("Workshop not found: {}", talk.getId());
                return null;
            }
        }

        return data;
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.TALKS_PLANNING_DOWNLOAD;
    }

    @Override
    public String getFilename(Salon payload, Map<String, Object> context) {
        String salonPlace = payload.getPlace().replaceAll("[^a-zA-Z0-9]", "_");
        return "Planning_Talks_" + salonPlace + ".pdf";
    }

    // Inner classes for template data
    @Data
    public static class PageData {
        private String dayLabel;
        private String roomLabel;
        private List<TalkData> talks = new ArrayList<>();
    }

    @Data
    public static class TalkData {
        private String startTime;
        private String title;
        private String therapistName;
        private String exhibitorFullName;
        private String duration;
        private String description;
    }
}
