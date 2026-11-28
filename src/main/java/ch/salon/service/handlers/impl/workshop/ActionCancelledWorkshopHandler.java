package ch.salon.service.handlers.impl.workshop;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

import static ch.salon.service.handlers.impl.common.ParentParticipationSupport.supportsWhenParentActive;

@Component
public class ActionCancelledWorkshopHandler implements BusinessActionHandler<Workshop>, ActionMetadataProvider {
    @Override
    public ActionSupport supports(Workshop payload, Map<String, Object> context) {
        return supportsWhenParentActive(payload,
                payload != null && payload.getStatus() != Status.CANCELED
                        && payload.getStatus() != Status.REFUSED
                        && payload.getStatus() != Status.CLOSED,
                "action.workshop-marked-as-cancelled.help", "action.workshop.condition.parent-participation-active",
                Workshop::getParticipation);
    }
    @Override public void execute(Workshop payload, Map<String, Object> context) { payload.setStatus(Status.CANCELED); }
    @Override public ContextActionType getActionType() { return ContextActionType.WORKSHOP_MARK_AS_CANCELLED; }
    @Override public String getConfirmationKey() { return "common.confirmAction.default"; }
}
