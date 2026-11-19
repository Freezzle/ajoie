package ch.salon.service.handlers.impl.workshop;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class ActionRefusedWorkshopHandler implements BusinessActionHandler<Workshop>, ActionMetadataProvider {
    @Override public ActionSupport supports(Workshop payload, Map<String, Object> context) { return payload != null && (payload.getStatus() == Status.IN_VERIFICATION || payload.getStatus() == Status.ACCEPTED) ? ActionSupport.allowed("action.workshop-marked-as-refused.help") : ActionSupport.rejected(); }
    @Override public void execute(Workshop payload, Map<String, Object> context) { payload.setStatus(Status.REFUSED); }
    @Override public ContextActionType getActionType() { return ContextActionType.WORKSHOP_MARK_AS_REFUSED; }
    @Override public String getConfirmationKey() { return "common.confirmAction.default"; }
}
