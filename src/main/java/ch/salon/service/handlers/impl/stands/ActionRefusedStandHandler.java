package ch.salon.service.handlers.impl.stands;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

import static ch.salon.service.handlers.impl.common.ParentParticipationSupport.supportsWhenParentActive;

@Component
public class ActionRefusedStandHandler implements BusinessActionHandler<Stand>, ActionMetadataProvider {
    @Override
    public ActionSupport supports(Stand payload, Map<String, Object> context) {
        return supportsWhenParentActive(payload,
                payload != null && (payload.getStatus() == Status.IN_VERIFICATION || payload.getStatus() == Status.ACCEPTED),
                "action.stand-marked-as-refused.help", "action.stand.condition.parent-participation-active",
                Stand::getParticipation);
    }
    @Override public void execute(Stand payload, Map<String, Object> context) { payload.setStatus(Status.REFUSED); }
    @Override public ContextActionType getActionType() { return ContextActionType.STAND_MARK_AS_REFUSED; }
    @Override public String getConfirmationKey() { return "common.confirmAction.default"; }
}
