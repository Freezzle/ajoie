package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Conference;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.Stand;
import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component("closeParticipation")
@RequiredArgsConstructor
public class ActionCloseHandler implements BusinessActionHandler<Participation>, ActionMetadataProvider {

    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final StandRepository standRepository;
    private final InvoicingPlanRepository planRepository;
    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload == null || (payload.getStatus() != Status.VALIDATED && payload.getStatus() != Status.ACCEPTED)) {
            return ActionSupport.rejected();
        }

        if (this.standRepository.existsStandByParticipationIdAndStatusIn(payload.getId(), Status.IN_VERIFICATION)) {
            return ActionSupport.disabled("action.participation-marked-as-closed.disabled.stands-in-verification");
        }

        if (this.conferenceRepository.existsConferenceByParticipationIdAndStatusIn(payload.getId(),
                Status.IN_VERIFICATION)) {
            return ActionSupport.disabled("action.participation-marked-as-closed.disabled.conferences-in-verification");
        }

        if (this.workshopRepository.existsWorkshopByParticipationIdAndStatusIn(payload.getId(),
                Status.IN_VERIFICATION)) {
            return ActionSupport.disabled("action.participation-marked-as-closed.disabled.workshops-in-verification");
        }

        List<InvoicingPlan> plans = this.planRepository.findByParticipationIdOrderByBillingNumberDesc(payload.getId());
        if (plans.stream().anyMatch(plan -> plan.getState().isDraft() || plan.getState() == State.ISSUED ||
                plan.getState() == State.IS_ISSUING)) {
            return ActionSupport.disabled("action.participation-marked-as-closed.disabled.unpaid-invoices");
        }

        return ActionSupport.allowed("action.participation-marked-as-closed.help");
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        stands.forEach(stand -> {
            if (stand.getStatus() == Status.VALIDATED || stand.getStatus() == Status.ACCEPTED) {
                Status oldStandStatus = Status.valueOf(stand.getStatus().name());
                stand.setStatus(Status.CLOSED);
                eventLogService.eventFromSystem("Stand clôturé", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(), Map.of("old_status", oldStandStatus.name(), "id", stand.getId().toString()));
            }
        });

        List<Conference> conferences =
                this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        conferences.forEach(conference -> {
            if (conference.getStatus() == Status.VALIDATED || conference.getStatus() == Status.ACCEPTED) {

                Status oldConferenceStatus = Status.valueOf(conference.getStatus().name());
                conference.setStatus(Status.CLOSED);
                eventLogService.eventFromSystem("Conference clôturée", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldConferenceStatus.name(), "id", conference.getId().toString()));
            }
        });

        List<Workshop> workshops =
                this.workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        workshops.forEach(workshop -> {
            if (workshop.getStatus() == Status.VALIDATED || workshop.getStatus() == Status.ACCEPTED) {

                Status oldWorkshopStatus = Status.valueOf(workshop.getStatus().name());
                workshop.setStatus(Status.CLOSED);
                eventLogService.eventFromSystem("Atelier clôturé", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldWorkshopStatus.name(), "id", workshop.getId().toString()));
            }
        });

        Status oldStatus = Status.valueOf(payload.getStatus().name());
        payload.setStatus(Status.CLOSED);
        eventLogService.eventFromSystem("Participation finalisée", EventType.ACTION, EntityType.PARTICIPATION,
                payload.getId(), Map.of("old_status", oldStatus.name()));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_CLOSED;
    }

    @Override
    public String getConfirmationKey() {
        return "action.participation-marked-as-closed.confirm";
    }
}
