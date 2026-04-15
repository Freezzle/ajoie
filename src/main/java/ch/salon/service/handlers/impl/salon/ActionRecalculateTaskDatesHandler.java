package ch.salon.service.handlers.impl.salon;

import ch.salon.domain.Salon;
import ch.salon.service.TaskInstanceService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionRecalculateTaskDatesHandler implements BusinessActionHandler<Salon>, ActionMetadataProvider {

    private final TaskInstanceService taskInstanceService;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null) {
            return ActionSupport.rejected();
        }

        boolean hasStartingDate = payload.getStartingDate() != null;
        boolean hasDesynchronizedDates = hasStartingDate &&
                taskInstanceService.hasDesynchronizedDates(payload.getId());

        return ActionSupport.fromConditions("action.salon-recalculate-task-dates.help",
            ConditionalKey.of(hasStartingDate, "action.salon-recalculate-task-dates.condition.has-starting-date"),
            ConditionalKey.of(hasDesynchronizedDates, "action.salon-recalculate-task-dates.condition.has-desynchronized-dates")
        );
    }

    @Override
    public void execute(Salon payload, Map<String, Object> context) {
        taskInstanceService.recalculateTaskDates(payload.getId());
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.SALON_RECALCULATE_TASK_DATES;
    }

    @Override
    public String getConfirmationKey() {
        return "action.salon-recalculate-task-dates.confirm";
    }
}
