package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component("markAsOnHold")
@RequiredArgsConstructor
public class ActionOnHoldHandler implements BusinessActionHandler<Participation>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload != null && payload.getStatus() == Status.IN_VERIFICATION
                && !Boolean.TRUE.equals(payload.getOnHold())) {
            return ActionSupport.allowed("action.participation-marked-as-on-hold.help");
        }
        return ActionSupport.rejected();
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        payload.setOnHold(true);
        eventLogService.eventFromSystem("Participation mise en attente", EventType.ACTION, EntityType.PARTICIPATION,
                payload.getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_ON_HOLD;
    }
}
