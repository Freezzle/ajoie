package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Conference;
import ch.salon.domain.Participation;
import ch.salon.domain.Stand;
import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionValidateHandler implements BusinessActionHandler<Participation>, ActionMetadataProvider {

    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final StandRepository standRepository;
    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload == null || payload.getStatus() != Status.ACCEPTED) {
            return ActionSupport.rejected();
        }

        boolean hasStandsInVerification = this.standRepository.existsStandByParticipationIdAndStatusIn(payload.getId(), Status.IN_VERIFICATION);
        boolean hasConferencesInVerification = this.conferenceRepository.existsConferenceByParticipationIdAndStatusIn(payload.getId(), Status.IN_VERIFICATION);
        boolean hasWorkshopsInVerification = this.workshopRepository.existsWorkshopByParticipationIdAndStatusIn(payload.getId(), Status.IN_VERIFICATION);

        List<ConditionalKey> conditions = new ArrayList<>();

        if (hasStandsInVerification) {
            conditions.add(ConditionalKey.nok("action.participation-marked-as-validated.condition.stands-verified"));
        } else {
            conditions.add(ConditionalKey.ok("action.participation-marked-as-validated.condition.stands-verified"));
        }

        if (hasConferencesInVerification) {
            conditions.add(ConditionalKey.nok("action.participation-marked-as-validated.condition.conferences-verified"));
        } else {
            conditions.add(ConditionalKey.ok("action.participation-marked-as-validated.condition.conferences-verified"));
        }

        if (hasWorkshopsInVerification) {
            conditions.add(ConditionalKey.nok("action.participation-marked-as-validated.condition.workshops-verified"));
        } else {
            conditions.add(ConditionalKey.ok("action.participation-marked-as-validated.condition.workshops-verified"));
        }

        //TODO: Later, we can only validate if (accepted && arrangement) or (accepted && !arrangement && invoicing plan paid)

        if (hasStandsInVerification || hasConferencesInVerification || hasWorkshopsInVerification) {
            return ActionSupport.disabled("action.participation-marked-as-validated.help", conditions.toArray(new ConditionalKey[0]));
        }

        return ActionSupport.allowed("action.participation-marked-as-validated.help", conditions.toArray(new ConditionalKey[0]));
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        stands.forEach(stand -> {
            if (stand.getStatus() == Status.ACCEPTED) {
                Status oldStandStatus = Status.valueOf(stand.getStatus().name());
                stand.setStatus(Status.VALIDATED);
                eventLogService.eventFromSystem("Stand validé", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(), Map.of("old_status", oldStandStatus.name(), "id", stand.getId().toString()));
            }
        });

        List<Conference> conferences =
                this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        conferences.forEach(conference -> {
            if (conference.getStatus() == Status.ACCEPTED) {

                Status oldConferenceStatus = Status.valueOf(conference.getStatus().name());
                conference.setStatus(Status.VALIDATED);
                eventLogService.eventFromSystem("Conference validée", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldConferenceStatus.name(), "id", conference.getId().toString()));
            }
        });


        List<Workshop> workshops =
                this.workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        workshops.forEach(workshop -> {
            if (workshop.getStatus() == Status.ACCEPTED) {

                Status oldWorkshopStatus = Status.valueOf(workshop.getStatus().name());
                workshop.setStatus(Status.VALIDATED);
                eventLogService.eventFromSystem("Atelier validé", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldWorkshopStatus.name(), "id", workshop.getId().toString()));
            }
        });

        Status oldStatus = Status.valueOf(payload.getStatus().name());
        payload.setStatus(Status.VALIDATED);
        eventLogService.eventFromSystem("Participation validée", EventType.ACTION, EntityType.PARTICIPATION,
                payload.getId(), Map.of("old_status", oldStatus.name()));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_VALIDATED;
    }
}
