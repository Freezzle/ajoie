package ch.salon.service.volunteer;

import ch.salon.domain.PlanningVolunteerSalon;
import ch.salon.domain.VolunteerAvailabilityDay;
import ch.salon.domain.VolunteerPlanningCell;
import ch.salon.domain.VolunteerPlanningConfiguration;
import ch.salon.domain.VolunteerPlanningData;
import ch.salon.domain.VolunteerPlanningDay;
import ch.salon.domain.VolunteerPlanningUnavailableCell;
import ch.salon.domain.VolunteerRegistration;
import ch.salon.domain.VolunteerTimeRange;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.VolunteerRegistrationStatus;
import ch.salon.repository.PlanningVolunteerSalonRepository;
import ch.salon.service.EventLogService;
import ch.salon.service.util.WallClock;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Propage une inscription bénévole vers le planning (table salon_volunteer_planning).
 * <p>
 * <b>Synchronisation par différence</b> : lors d'une mise à jour, seuls les jours dont la
 * disponibilité a réellement changé entre l'ancienne et la nouvelle version soumises en ligne
 * sont réécrits. Les éditions manuelles de l'organisateur sur les jours que le bénévole ne
 * retouche pas sont conservées.
 * <p>
 * Doit s'exécuter dans la même transaction que la sauvegarde de l'inscription. Le verrou
 * optimiste ({@code @Version}) sur le planning protège contre un enregistrement admin concurrent.
 */
@Service
@RequiredArgsConstructor
public class VolunteerPlanningSyncService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VolunteerPlanningSyncService.class);

    private final PlanningVolunteerSalonRepository planningRepository;
    private final EventLogService eventLogService;

    /**
     * @param oldReg version précédente de l'inscription (null à la création)
     * @param newReg version courante déjà persistée
     */
    public void apply(UUID salonId, VolunteerRegistration oldReg, VolunteerRegistration newReg) {
        PlanningVolunteerSalon planning = planningRepository.findBySalonId(salonId);
        if (planning == null || planning.getConfiguration() == null) {
            LOGGER.warn("Aucun planning bénévole pour le salon {}, synchronisation ignorée", salonId);
            return;
        }

        VolunteerPlanningConfiguration config = planning.getConfiguration();
        String volunteerId = newReg.getPlanningVolunteerId();

        boolean active = newReg.getStatus() == VolunteerRegistrationStatus.ACTIVE;

        if (!active) {
            removeEverywhere(config, volunteerId);
            planning.getVolunteers().removeIf(v -> volunteerId.equals(v.getId()));
            planningRepository.save(planning);
            return;
        }

        upsertVolunteer(planning, volunteerId, buildLabel(newReg));

        for (VolunteerPlanningDay day : config.getDays()) {
            VolunteerAvailabilityDay newDay = findDay(newReg.getAvailability(), day.getId());
            VolunteerAvailabilityDay oldDay = oldReg == null ? null : findDay(oldReg.getAvailability(), day.getId());

            if (oldReg != null && sameAvailability(oldDay, newDay)) {
                continue; // jour non modifié en ligne : on préserve les éditions admin
            }

            if (newDay != null && newDay.isAvailable()) {
                applyAvailableDay(day, volunteerId, newDay, newReg.getId());
            } else {
                clearDay(day, volunteerId);
            }
        }

        planningRepository.save(planning);
    }

    // -------------------- JOURS --------------------

    private void applyAvailableDay(VolunteerPlanningDay day, String volunteerId, VolunteerAvailabilityDay availability,
            UUID registrationId) {
        if (!day.getAssignedVolunteerIds().contains(volunteerId)) {
            day.getAssignedVolunteerIds().add(volunteerId);
        }

        int slotCount = slotCount(day);
        int interval = intervalOf(day);
        int dayStart = toMinutes(WallClock.hhmm(day.getStartTime()));
        int dayEnd = toMinutes(WallClock.hhmm(day.getEndTime()));
        List<int[]> ranges = mergedRanges(availability.getRanges());

        // Recalcule les créneaux indisponibles de ce bénévole : tout créneau non entièrement couvert.
        day.getUnavailableCells().removeIf(c -> volunteerId.equals(c.getVolunteerId()));
        List<Integer> unavailableSlots = new ArrayList<>();
        for (int i = 0; i < slotCount; i++) {
            int slotStart = dayStart + i * interval;
            int slotEnd = Math.min(slotStart + interval, dayEnd);
            if (!covered(ranges, slotStart, slotEnd)) {
                unavailableSlots.add(i);
                VolunteerPlanningUnavailableCell cell = new VolunteerPlanningUnavailableCell();
                cell.setVolunteerId(volunteerId);
                cell.setSlotIndex(i);
                day.getUnavailableCells().add(cell);
            }
        }

        // Retire les affectations tombant désormais sur un créneau indisponible.
        List<VolunteerPlanningCell> removed = new ArrayList<>();
        day.getCells().removeIf(cell -> {
            boolean drop = volunteerId.equals(cell.getVolunteerId()) && unavailableSlots.contains(cell.getSlotIndex());
            if (drop) {
                removed.add(cell);
            }
            return drop;
        });

        if (!removed.isEmpty()) {
            eventLogService.eventFromSystem(
                    "Affectations retirées suite à la modification de disponibilités (" + removed.size() + ")",
                    EventType.ACTION, EntityType.SALON, registrationId, null);
        }
    }

    private void clearDay(VolunteerPlanningDay day, String volunteerId) {
        day.getAssignedVolunteerIds().removeIf(volunteerId::equals);
        day.getCells().removeIf(c -> volunteerId.equals(c.getVolunteerId()));
        day.getUnavailableCells().removeIf(c -> volunteerId.equals(c.getVolunteerId()));
    }

    private void removeEverywhere(VolunteerPlanningConfiguration config, String volunteerId) {
        for (VolunteerPlanningDay day : config.getDays()) {
            clearDay(day, volunteerId);
        }
    }

    // -------------------- VOLONTAIRE --------------------

    private void upsertVolunteer(PlanningVolunteerSalon planning, String volunteerId, String label) {
        Optional<VolunteerPlanningData> found = planning.getVolunteers().stream()
                .filter(v -> volunteerId.equals(v.getId())).findFirst();
        if (found.isPresent()) {
            found.orElseThrow().setLabel(label);
        } else {
            VolunteerPlanningData data = new VolunteerPlanningData();
            data.setId(volunteerId);
            data.setLabel(label);
            planning.getVolunteers().add(data);
        }
    }

    private String buildLabel(VolunteerRegistration reg) {
        return StringUtils.trim(StringUtils.defaultString(reg.getFirstName()) + " " +
                StringUtils.defaultString(reg.getLastName()));
    }

    // -------------------- DISPONIBILITE --------------------

    private VolunteerAvailabilityDay findDay(List<VolunteerAvailabilityDay> days, String dayId) {
        if (days == null) {
            return null;
        }
        return days.stream().filter(d -> dayId.equals(d.getDayId())).findFirst().orElse(null);
    }

    /** Deux disponibilités de jour sont identiques si même présence et mêmes plages (ordre indifférent). */
    private boolean sameAvailability(VolunteerAvailabilityDay a, VolunteerAvailabilityDay b) {
        boolean aAvail = a != null && a.isAvailable();
        boolean bAvail = b != null && b.isAvailable();
        if (aAvail != bAvail) {
            return false;
        }
        if (!aAvail) {
            return true;
        }
        return normalize(a.getRanges()).equals(normalize(b.getRanges()));
    }

    private List<String> normalize(List<VolunteerTimeRange> ranges) {
        List<String> out = new ArrayList<>();
        if (ranges != null) {
            ranges.stream().sorted(Comparator.comparing(VolunteerTimeRange::getStart))
                  .forEach(r -> out.add(r.getStart() + "-" + r.getEnd()));
        }
        return out;
    }

    /** Fusionne les plages en intervalles de minutes triés et non chevauchants. */
    private List<int[]> mergedRanges(List<VolunteerTimeRange> ranges) {
        List<int[]> intervals = new ArrayList<>();
        if (ranges == null) {
            return intervals;
        }
        ranges.stream().filter(Objects::nonNull)
              .map(r -> new int[]{toMinutes(r.getStart()), toMinutes(r.getEnd())})
              .filter(iv -> iv[1] > iv[0])
              .sorted(Comparator.comparingInt(iv -> iv[0]))
              .forEach(iv -> {
                  if (!intervals.isEmpty() && iv[0] <= intervals.get(intervals.size() - 1)[1]) {
                      intervals.get(intervals.size() - 1)[1] = Math.max(intervals.get(intervals.size() - 1)[1], iv[1]);
                  } else {
                      intervals.add(iv);
                  }
              });
        return intervals;
    }

    private boolean covered(List<int[]> ranges, int start, int end) {
        for (int[] iv : ranges) {
            if (iv[0] <= start && iv[1] >= end) {
                return true;
            }
        }
        return false;
    }

    private int slotCount(VolunteerPlanningDay day) {
        int diff = toMinutes(WallClock.hhmm(day.getEndTime())) - toMinutes(WallClock.hhmm(day.getStartTime()));
        int interval = intervalOf(day);
        if (diff <= 0 || interval <= 0) {
            return 0;
        }
        return (int) Math.ceil((double) diff / interval);
    }

    private int intervalOf(VolunteerPlanningDay day) {
        return day.getIntervalMinutes() != null && day.getIntervalMinutes() > 0 ? day.getIntervalMinutes() : 60;
    }

    private int toMinutes(String hhmm) {
        if (StringUtils.isBlank(hhmm) || !hhmm.contains(":")) {
            return 0;
        }
        String[] parts = hhmm.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
}
