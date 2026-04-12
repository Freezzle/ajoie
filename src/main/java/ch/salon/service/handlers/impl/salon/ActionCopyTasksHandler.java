package ch.salon.service.handlers.impl.salon;

import ch.salon.domain.Salon;
import ch.salon.repository.SalonRepository;
import ch.salon.service.TaskInstanceService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.RequiredField;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.FieldType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ActionCopyTasksHandler implements BusinessActionHandler<Salon>, ActionMetadataProvider {

    private final SalonRepository salonRepository;
    private final TaskInstanceService taskInstanceService;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }

        boolean hasStartingDate = payload.getStartingDate() != null;
        boolean startingDateInFuture = hasStartingDate && payload.getStartingDate().isAfter(Instant.now());

        return ActionSupport.fromConditions("action.salon-copy-tasks.help",
            ConditionalKey.of(hasStartingDate, "action.salon-copy-tasks.condition.has-starting-date"),
            ConditionalKey.of(startingDateInFuture, "action.salon-copy-tasks.condition.starting-date-in-future")
        );
    }

    @Override
    public void execute(Salon payload, Map<String, Object> context) {
        Object sourceSalonIdRaw = context.get("sourceSalonId");
        if (sourceSalonIdRaw == null) {
            throw new IllegalArgumentException("sourceSalonId is required");
        }

        // Le PICKLIST retourne une liste — on prend le premier élément
        String sourceSalonIdStr;
        if (sourceSalonIdRaw instanceof List<?> list && !list.isEmpty()) {
            sourceSalonIdStr = list.getFirst().toString();
        } else {
            sourceSalonIdStr = sourceSalonIdRaw.toString();
        }

        UUID sourceSalonId = UUID.fromString(sourceSalonIdStr);
        taskInstanceService.copyRecurringTasksFromSalon(payload.getId(), sourceSalonId);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.SALON_COPY_TASKS;
    }

    @Override
    public List<RequiredField> getRequiredFields(Object payload) {
        if (!(payload instanceof Salon currentSalon)) {
            return List.of();
        }

        List<Salon> otherSalons = salonRepository.findAll().stream()
                .filter(s -> !s.getId().equals(currentSalon.getId()))
                .sorted((a, b) -> {
                    // Tri décroissant : les salons les plus récents en premier
                    if (a.getStartingDate() == null && b.getStartingDate() == null) return 0;
                    if (a.getStartingDate() == null) return 1;
                    if (b.getStartingDate() == null) return -1;
                    return b.getStartingDate().compareTo(a.getStartingDate());
                })
                .toList();

        List<Map<String, String>> salonOptions = new ArrayList<>();
        for (Salon salon : otherSalons) {
            String label = salon.getPlace();
            if (salon.getStartingDate() != null) {
                java.time.LocalDate date = salon.getStartingDate()
                        .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
                label += " — " + date.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            }
            salonOptions.add(Map.of("id", salon.getId().toString(), "label", label));
        }

        return List.of(
                new RequiredField("sourceSalonId", FieldType.PICKLIST, "action.salon-copy-tasks.field.sourceSalon", salonOptions)
        );
    }
}
