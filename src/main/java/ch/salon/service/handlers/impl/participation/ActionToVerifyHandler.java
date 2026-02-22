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

@Component
@RequiredArgsConstructor
public class ActionToVerifyHandler implements BusinessActionHandler<Participation>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload != null && payload.getStatus() != Status.IN_VERIFICATION) {
            return ActionSupport.allowed("action.participation-marked-as-verification.help");
        }
        return ActionSupport.rejected();
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        Status oldStatus = Status.valueOf(payload.getStatus().name());
        payload.setStatus(Status.IN_VERIFICATION);
        eventLogService.eventFromSystem("Participation en vérification", EventType.ACTION, EntityType.PARTICIPATION,
                payload.getId(), Map.of("old_status", oldStatus.name()));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_VERIFICATION;
    }
}
