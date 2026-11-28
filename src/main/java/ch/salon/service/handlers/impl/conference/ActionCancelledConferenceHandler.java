package ch.salon.service.handlers.impl.conference;

import ch.salon.domain.Conference;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.stereotype.Component;
import java.util.Map;

import static ch.salon.service.handlers.impl.common.ParentParticipationSupport.supportsWhenParentActive;

@Component
public class ActionCancelledConferenceHandler implements BusinessActionHandler<Conference>, ActionMetadataProvider {
    @Override
    public ActionSupport supports(Conference payload, Map<String, Object> context) {
        return supportsWhenParentActive(payload,
                payload != null && payload.getStatus() != Status.CANCELED
                        && payload.getStatus() != Status.REFUSED
                        && payload.getStatus() != Status.CLOSED,
                "action.conference-marked-as-cancelled.help", "action.conference.condition.parent-participation-active",
                Conference::getParticipation);
    }
    @Override public void execute(Conference payload, Map<String, Object> context) { payload.setStatus(Status.CANCELED); }
    @Override public ContextActionType getActionType() { return ContextActionType.CONFERENCE_MARK_AS_CANCELLED; }
    @Override public String getConfirmationKey() { return "common.confirmAction.default"; }
}
