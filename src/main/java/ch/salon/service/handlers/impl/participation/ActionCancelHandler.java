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
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component("cancelParticipation")
@RequiredArgsConstructor
public class ActionCancelHandler implements BusinessActionHandler<Participation>, ActionMetadataProvider {

    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final StandRepository standRepository;
    private final InvoicingPlanRepository planRepository;
    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(Participation payload, Map<String, Object> context) {
        if (payload == null || payload.getStatus() == Status.CANCELED || payload.getStatus() == Status.REFUSED) {
            return ActionSupport.rejected();
        }

        List<InvoicingPlan> plans = this.planRepository.findByParticipationIdOrderByBillingNumberDesc(payload.getId());
        boolean hasPendingInvoices = plans.stream().anyMatch(plan -> plan.getState().isDraft() || plan.getState() == State.ISSUED || plan.getState() == State.IS_ISSUING);

        if (hasPendingInvoices) {
            return ActionSupport.disabled("action.participation-marked-as-cancelled.help",
                ConditionalKey.nok("action.participation-marked-as-cancelled.condition.invoices-settled"));
        }

        return ActionSupport.allowed("action.participation-marked-as-cancelled.help",
            ConditionalKey.ok("action.participation-marked-as-cancelled.condition.invoices-settled"));
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        stands.forEach(stand -> {
            if (stand.getStatus() == Status.CLOSED || stand.getStatus() == Status.VALIDATED ||
                    stand.getStatus() == Status.ACCEPTED || stand.getStatus() == Status.IN_VERIFICATION) {

                Status oldStandStatus = Status.valueOf(stand.getStatus().name());
                stand.setStatus(Status.CANCELED);
                eventLogService.eventFromSystem("Stand annulé", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(), Map.of("old_status", oldStandStatus.name(), "id", stand.getId().toString()));
            }
        });

        List<Conference> conferences =
                this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        conferences.forEach(conference -> {
            if (conference.getStatus() == Status.CLOSED || conference.getStatus() == Status.VALIDATED ||
                    conference.getStatus() == Status.ACCEPTED || conference.getStatus() == Status.IN_VERIFICATION) {

                Status oldConferenceStatus = Status.valueOf(conference.getStatus().name());
                conference.setStatus(Status.CANCELED);
                eventLogService.eventFromSystem("Conference annulée", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldConferenceStatus.name(), "id", conference.getId().toString()));
            }
        });

        List<Workshop> workshops =
                this.workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        workshops.forEach(workshop -> {
            if (workshop.getStatus() == Status.CLOSED || workshop.getStatus() == Status.VALIDATED ||
                    workshop.getStatus() == Status.ACCEPTED || workshop.getStatus() == Status.IN_VERIFICATION) {

                Status oldWorkshopStatus = Status.valueOf(workshop.getStatus().name());
                workshop.setStatus(Status.CANCELED);
                eventLogService.eventFromSystem("Atelier annulé", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldWorkshopStatus.name(), "id", workshop.getId().toString()));
            }
        });

        Status oldStatus = Status.valueOf(payload.getStatus().name());
        payload.setStatus(Status.CANCELED);
        eventLogService.eventFromSystem("Participation annulée", EventType.ACTION, EntityType.PARTICIPATION,
                payload.getId(), Map.of("old_status", oldStatus.name()));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_CANCELLED;
    }

    @Override
    public String getConfirmationKey() {
        return "action.participation-marked-as-cancelled.confirm";
    }
}
