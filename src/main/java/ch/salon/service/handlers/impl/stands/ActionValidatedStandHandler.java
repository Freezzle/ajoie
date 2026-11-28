package ch.salon.service.handlers.impl.stands;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

import static ch.salon.service.handlers.impl.common.ParentParticipationSupport.supportsWhenParentActive;

@Component
public class ActionValidatedStandHandler implements BusinessActionHandler<Stand> {
    @Override
    public ActionSupport supports(Stand payload, Map<String, Object> context) {
        return supportsWhenParentActive(payload, payload != null && payload.getStatus() == Status.ACCEPTED,
                "action.stand-marked-as-validated.help", "action.stand.condition.parent-participation-active",
                Stand::getParticipation);
    }
    @Override public void execute(Stand payload, Map<String, Object> context) { payload.setStatus(Status.VALIDATED); }
    @Override public ContextActionType getActionType() { return ContextActionType.STAND_MARK_AS_VALIDATED; }
}
