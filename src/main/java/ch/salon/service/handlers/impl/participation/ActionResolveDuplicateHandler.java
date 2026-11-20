package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Participation;
import ch.salon.service.ExhibitorDuplicateService;
import ch.salon.service.duplicate.DuplicateDecision;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ActionResolveDuplicateHandler implements BusinessActionHandler<Participation>, ActionMetadataProvider {

    private static final String ENTITY_NAME = "participationDuplicate";
    private final ExhibitorDuplicateService exhibitorDuplicateService;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload == null || payload.getExhibitor() == null || !payload.getExhibitor().isDuplicateDetected()) {
            return ActionSupport.rejected();
        }
        return ActionSupport.allowed("action.participation-resolve-duplicate.help");
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        DuplicateDecision decision = parseDecision(context.get("decision"));
        UUID targetExhibitorId = parseUuid(context.get("targetExhibitorId"));

        if (decision == null) {
            throw new BadRequestAlertException("Décision requise", ENTITY_NAME, "duplicate.decision-required");
        }

        if ((decision == DuplicateDecision.MERGE || decision == DuplicateDecision.KEEP_SEPARATE)
                && targetExhibitorId == null) {
            throw new BadRequestAlertException("Candidat requis", ENTITY_NAME, "duplicate.target-required");
        }

        exhibitorDuplicateService.resolveForParticipation(payload, decision, targetExhibitorId);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_RESOLVE_DUPLICATE;
    }

    private DuplicateDecision parseDecision(Object rawDecision) {
        if (rawDecision == null) {
            return null;
        }
        try {
            return DuplicateDecision.valueOf(rawDecision.toString());
        } catch (IllegalArgumentException e) {
            throw new BadRequestAlertException("Décision invalide", ENTITY_NAME, "duplicate.decision-invalid");
        }
    }

    private UUID parseUuid(Object rawUuid) {
        if (rawUuid == null) {
            return null;
        }
        try {
            return UUID.fromString(rawUuid.toString());
        } catch (IllegalArgumentException e) {
            throw new BadRequestAlertException("UUID invalide", ENTITY_NAME, "duplicate.target-invalid");
        }
    }
}
