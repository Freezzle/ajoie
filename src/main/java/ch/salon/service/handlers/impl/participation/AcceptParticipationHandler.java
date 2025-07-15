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
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AcceptParticipationHandler implements BusinessActionHandler<Participation> {

    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final StandRepository standRepository;
    private final EventLogService eventLogService;

    public AcceptParticipationHandler(EventLogService eventLogService, StandRepository standRepository,
            WorkshopRepository workshopRepository, ConferenceRepository conferenceRepository) {
        this.eventLogService = eventLogService;
        this.standRepository = standRepository;
        this.workshopRepository = workshopRepository;
        this.conferenceRepository = conferenceRepository;
    }

    @Override
    public SupportType supports(Participation payload, Map<String, Object> context) {
        return payload != null && payload.getStatus() == Status.IN_VERIFICATION ? SupportType.ALLOWED :
                SupportType.REJECTED;
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        stands.forEach(stand -> {
            if (stand.getStatus() == Status.IN_VERIFICATION) {
                Status oldStandStatus = Status.valueOf(stand.getStatus().name());
                stand.setStatus(Status.ACCEPTED);
                eventLogService.eventFromSystem("Stand accepté", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(), Map.of("old_status", oldStandStatus.name(), "id", stand.getId().toString()));
            }
        });

        List<Conference> conferences =
                this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        conferences.forEach(conference -> {
            if (conference.getStatus() == Status.IN_VERIFICATION) {

                Status oldConferenceStatus = Status.valueOf(conference.getStatus().name());
                conference.setStatus(Status.ACCEPTED);
                eventLogService.eventFromSystem("Conference accepté", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldConferenceStatus.name(), "id", conference.getId().toString()));
            }
        });

        List<Workshop> workshops =
                this.workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        workshops.forEach(workshop -> {
            if (workshop.getStatus() == Status.IN_VERIFICATION) {

                Status oldWorkshopStatus = Status.valueOf(workshop.getStatus().name());
                workshop.setStatus(Status.ACCEPTED);
                eventLogService.eventFromSystem("Atelier acceptée", EventType.ACTION, EntityType.PARTICIPATION,
                        payload.getId(),
                        Map.of("old_status", oldWorkshopStatus.name(), "id", workshop.getId().toString()));
            }
        });

        Status oldStatus = Status.valueOf(payload.getStatus().name());
        payload.setStatus(Status.ACCEPTED);
        eventLogService.eventFromSystem("Participation acceptée", EventType.ACTION, EntityType.PARTICIPATION,
                payload.getId(), Map.of("old_status", oldStatus.name()));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_ACCEPTED;
    }
}
