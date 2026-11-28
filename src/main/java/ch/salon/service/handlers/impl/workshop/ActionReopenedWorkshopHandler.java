package ch.salon.service.handlers.impl.workshop;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

import static ch.salon.service.handlers.impl.common.ParentParticipationSupport.supportsWhenParentActive;

@Component
public class ActionReopenedWorkshopHandler implements BusinessActionHandler<Workshop> {
    @Override
    public ActionSupport supports(Workshop payload, Map<String, Object> context) {
        return supportsWhenParentActive(payload,
                payload != null && (payload.getStatus() == Status.REFUSED
                        || payload.getStatus() == Status.CANCELED
                        || payload.getStatus() == Status.CLOSED),
                "action.workshop-marked-as-reopened.help", "action.workshop.condition.parent-participation-active",
                Workshop::getParticipation);
    }
    @Override public void execute(Workshop payload, Map<String, Object> context) { payload.setStatus(Status.IN_VERIFICATION); }
    @Override public ContextActionType getActionType() { return ContextActionType.WORKSHOP_MARK_AS_REOPENED; }
}
