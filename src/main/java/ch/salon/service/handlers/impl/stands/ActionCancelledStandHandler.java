package ch.salon.service.handlers.impl.stands;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class ActionCancelledStandHandler implements BusinessActionHandler<Stand>, ActionMetadataProvider {
    @Override public ActionSupport supports(Stand payload, Map<String, Object> context) { return payload != null && payload.getStatus() != Status.CANCELED && payload.getStatus() != Status.REFUSED && payload.getStatus() != Status.CLOSED ? ActionSupport.allowed("action.stand-marked-as-cancelled.help") : ActionSupport.rejected(); }
    @Override public void execute(Stand payload, Map<String, Object> context) { payload.setStatus(Status.CANCELED); }
    @Override public ContextActionType getActionType() { return ContextActionType.STAND_MARK_AS_CANCELLED; }
    @Override public String getConfirmationKey() { return "common.confirmAction.default"; }
}
