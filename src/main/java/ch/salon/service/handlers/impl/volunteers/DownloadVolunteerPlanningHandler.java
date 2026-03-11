package ch.salon.service.handlers.impl.volunteers;

import ch.salon.domain.PlanningVolunteerSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.VolunteerPlanningCategory;
import ch.salon.domain.VolunteerPlanningCell;
import ch.salon.domain.VolunteerPlanningConfiguration;
import ch.salon.domain.VolunteerPlanningData;
import ch.salon.domain.VolunteerPlanningDay;
import ch.salon.domain.VolunteerPlanningUnavailableCell;
import ch.salon.repository.PlanningVolunteerSalonRepository;
import ch.salon.service.document.DocumentCreator;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamSource;
import org.springframework.stereotype.Component;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DownloadVolunteerPlanningHandler implements DocumentActionHandler<Salon>, ActionMetadataProvider {

    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Europe/Paris"));

    private final DocumentCreator documentCreator;
    private final PlanningVolunteerSalonRepository planningVolunteerSalonRepository;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }
        PlanningVolunteerSalon planning = planningVolunteerSalonRepository.findBySalonId(payload.getId());
        boolean isAllowed = planning != null
                && planning.getConfiguration() != null
                && !planning.getConfiguration().getDays().isEmpty();

        return ActionSupport.fromConditions(
                "action.volunteer-planning-download.help",
                ConditionalKey.of(isAllowed, "action.volunteer-planning-download.condition.configuration-filled")
        );
    }

    @Override
    public InputStreamSource download(Salon payload, Map<String, Object> context) throws IOException {
        Context thymeleafCtxt = new Context(Locale.FRENCH);

        UUID salonId = payload.getId();
        PlanningVolunteerSalon planning = planningVolunteerSalonRepository.findBySalonId(salonId);
        if (planning == null || planning.getConfiguration() == null) {
            throw new IllegalStateException("No volunteer planning found for salon: " + salonId);
        }

        // Map volunteers id -> label
        Map<String, String> volunteerLabels = new HashMap<>();
        if (planning.getVolunteers() != null) {
            for (VolunteerPlanningData v : planning.getVolunteers()) {
                volunteerLabels.put(v.getId(), v.getLabel());
            }
        }

        List<PageData> pages = buildPages(planning.getConfiguration(), volunteerLabels);
        thymeleafCtxt.setVariable("pages", pages);

        return this.documentCreator.build("volunteer-planning", thymeleafCtxt);
    }

    private List<PageData> buildPages(VolunteerPlanningConfiguration config, Map<String, String> volunteerLabels) {
        List<PageData> pages = new ArrayList<>();

        // Build category list & map
        Map<String, CategoryData> categoryMap = new HashMap<>();
        List<CategoryData> categories = new ArrayList<>();
        for (VolunteerPlanningCategory cat : config.getCategories()) {
            CategoryData cd = new CategoryData();
            cd.setId(cat.getId());
            cd.setLabel(cat.getLabel());
            cd.setColor(cat.getColor());
            categoryMap.put(cat.getId(), cd);
            categories.add(cd);
        }

        for (VolunteerPlanningDay day : config.getDays()) {
            PageData page = new PageData();
            page.setDayLabel(day.getLabel());

            int interval = day.getIntervalMinutes() != null ? day.getIntervalMinutes()
                    : (config.getIntervalMinutes() != null ? config.getIntervalMinutes() : 60);

            List<String> slots = computeSlotLabels(day.getStartTime(), day.getEndTime(), interval);
            page.setSlotLabels(slots);
            page.setTimeRange(formatTimeRange(day.getStartTime(), day.getEndTime()));
            page.setCategories(categories);

            List<String> assignedIds = day.getAssignedVolunteerIds() != null
                    ? day.getAssignedVolunteerIds() : List.of();
            page.setVolunteerCount(assignedIds.size());

            // Build cell map: volunteerId -> slotIndex -> categoryId
            Map<String, Map<Integer, String>> cellMap = new HashMap<>();
            if (day.getCells() != null) {
                for (VolunteerPlanningCell cell : day.getCells()) {
                    cellMap.computeIfAbsent(cell.getVolunteerId(), k -> new HashMap<>())
                           .put(cell.getSlotIndex(), cell.getCategoryId());
                }
            }

            // Build unavailable set: "volunteerId::slotIndex"
            java.util.Set<String> unavailableKeys = new java.util.HashSet<>();
            if (day.getUnavailableCells() != null) {
                for (VolunteerPlanningUnavailableCell uc : day.getUnavailableCells()) {
                    unavailableKeys.add(uc.getVolunteerId() + "::" + uc.getSlotIndex());
                }
            }

            // One row per assigned volunteer
            List<RowData> rows = new ArrayList<>();
            for (String vId : assignedIds) {
                RowData row = new RowData();
                row.setLabel(volunteerLabels.getOrDefault(vId, vId));
                Map<Integer, String> volCells = cellMap.getOrDefault(vId, Map.of());
                List<CellData> cells = new ArrayList<>();
                for (int i = 0; i < slots.size(); i++) {
                    CellData cell = new CellData();
                    boolean isUnavailable = unavailableKeys.contains(vId + "::" + i);
                    if (isUnavailable) {
                        cell.setUnavailable(true);
                        cell.setColor(null);
                    } else {
                        String catId = volCells.get(i);
                        CategoryData cat = catId != null ? categoryMap.get(catId) : null;
                        cell.setColor(cat != null ? cat.getColor() : null);
                        cell.setUnavailable(false);
                    }
                    cells.add(cell);
                }
                row.setCells(cells);
                rows.add(row);
            }
            page.setRows(rows);

            // One total row per category
            List<TotalRowData> totals = new ArrayList<>();
            for (CategoryData cat : categories) {
                TotalRowData total = new TotalRowData();
                total.setCategory(cat);
                List<Integer> counts = new ArrayList<>();
                for (int i = 0; i < slots.size(); i++) {
                    int count = 0;
                    for (String vId : assignedIds) {
                        Map<Integer, String> volCells = cellMap.getOrDefault(vId, Map.of());
                        if (cat.getId().equals(volCells.get(i))) {
                            count++;
                        }
                    }
                    counts.add(count);
                }
                total.setCounts(counts);
                totals.add(total);
            }
            page.setTotals(totals);

            pages.add(page);
        }

        return pages;
    }

    private List<String> computeSlotLabels(String startTimeIso, String endTimeIso, int intervalMinutes) {
        List<String> labels = new ArrayList<>();
        if (startTimeIso == null || endTimeIso == null) {
            return labels;
        }
        try {
            Instant start = Instant.parse(startTimeIso);
            Instant end = Instant.parse(endTimeIso);
            long diffSeconds = end.getEpochSecond() - start.getEpochSecond();
            int steps = (int) (diffSeconds / 60 / intervalMinutes);
            // counter : slots écoulés depuis la 1ère heure pleine rencontrée.
            // Afficher quand counter est pair (0, 2, 4…) → 1 sur 2 à partir de :00.
            // Avant la 1ère heure pleine : pas affiché (sauf le tout 1er slot).
            int counter = -1; // -1 = pas encore atteint une heure pleine
            for (int i = 0; i < steps; i++) {
                Instant t = start.plusSeconds((long) i * intervalMinutes * 60);
                String hhmm = TIME_FORMATTER.format(t);
                if (hhmm.endsWith(":00")) {
                    counter = 0;
                } else if (counter >= 0) {
                    counter++;
                }
                boolean show = (i == 0) || (counter >= 0 && counter % 2 == 0);
                labels.add(show ? hhmm : "");
            }
        } catch (Exception ignored) {
        }
        return labels;
    }

    private String formatTimeRange(String startTimeIso, String endTimeIso) {
        try {
            String start = TIME_FORMATTER.format(Instant.parse(startTimeIso));
            String end = TIME_FORMATTER.format(Instant.parse(endTimeIso));
            return start + " \u2013 " + end;
        } catch (Exception e) {
            return "";
        }
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.VOLUNTEER_PLANNING_DOWNLOAD;
    }

    @Override
    public String getFilename(Salon payload, Map<String, Object> context) {
        String place = payload.getPlace() != null
                ? payload.getPlace().replaceAll("[^a-zA-Z0-9]", "_") : "salon";
        return "Planning_Benevoles_" + place + ".pdf";
    }

    // ── Inner classes ──────────────────────────────────────────────────────────

    @Data
    public static class PageData {
        private String dayLabel;
        private String timeRange;
        private int volunteerCount;
        private List<String> slotLabels;
        private List<CategoryData> categories;
        private List<RowData> rows;
        private List<TotalRowData> totals;
    }

    @Data
    public static class RowData {
        private String label;
        private List<CellData> cells;
    }

    @Data
    public static class CellData {
        /** null = cellule vide */
        private String color;
        /** true = cellule non disponible (gris plein, aucune catégorie) */
        private boolean unavailable;
    }

    @Data
    public static class CategoryData {
        private String id;
        private String label;
        private String color;
    }

    @Data
    public static class TotalRowData {
        private CategoryData category;
        private List<Integer> counts;
    }
}
