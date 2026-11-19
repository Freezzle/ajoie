package ch.salon.service.handlers.impl.workshop;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class ActionReopenedWorkshopHandler implements BusinessActionHandler<Workshop> {
    @Override public ActionSupport supports(Workshop payload, Map<String, Object> context) { return payload != null && (payload.getStatus() == Status.REFUSED || payload.getStatus() == Status.CANCELED || payload.getStatus() == Status.CLOSED) ? ActionSupport.allowed("action.workshop-marked-as-reopened.help") : ActionSupport.rejected(); }
    @Override public void execute(Workshop payload, Map<String, Object> context) { payload.setStatus(Status.IN_VERIFICATION); }
    @Override public ContextActionType getActionType() { return ContextActionType.WORKSHOP_MARK_AS_REOPENED; }
}
