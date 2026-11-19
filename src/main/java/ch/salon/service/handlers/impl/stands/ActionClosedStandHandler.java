package ch.salon.service.handlers.impl.stands;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class ActionClosedStandHandler implements BusinessActionHandler<Stand> {
    @Override public ActionSupport supports(Stand payload, Map<String, Object> context) { return payload != null && payload.getStatus() == Status.VALIDATED ? ActionSupport.allowed("action.stand-marked-as-closed.help") : ActionSupport.rejected(); }
    @Override public void execute(Stand payload, Map<String, Object> context) { payload.setStatus(Status.CLOSED); }
    @Override public ContextActionType getActionType() { return ContextActionType.STAND_MARK_AS_CLOSED; }
}
