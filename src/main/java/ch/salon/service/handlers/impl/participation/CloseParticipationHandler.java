package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Conference;
import ch.salon.domain.Participation;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.StandRepository;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class CloseParticipationHandler implements BusinessActionHandler<Participation> {

    private final ConferenceRepository conferenceRepository;
    private final StandRepository standRepository;
    private final EventLogService eventLogService;

    public CloseParticipationHandler(EventLogService eventLogService, StandRepository standRepository,
                                     ConferenceRepository conferenceRepository) {
        this.eventLogService = eventLogService;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
    }

    @Override
    public SupportType supports(Participation payload, Map<String, Object> context) {
        if (payload == null || (payload.getStatus() != Status.VALIDATED && payload.getStatus() != Status.ACCEPTED)) {
            return SupportType.REJECTED;
        }

        if (this.standRepository.existsStandByParticipationIdAndStatusIn(payload.getId(), Status.IN_VERIFICATION)) {
            return SupportType.DISABLED;
        }

        if (this.conferenceRepository.existsStandByParticipationIdAndStatusIn(payload.getId(),
                                                                              Status.IN_VERIFICATION)) {
            return SupportType.DISABLED;
        }

        return SupportType.ALLOWED;
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        stands.forEach(stand -> {
            if (stand.getStatus() == Status.VALIDATED) {
                Status oldStandStatus = Status.valueOf(stand.getStatus().name());
                stand.setStatus(Status.CLOSED);
                eventLogService.eventFromSystem("Stand clôturé", EventType.ACTION, EntityType.PARTICIPATION,
                                                payload.getId(), Map.of("old_status", oldStandStatus.name(), "id",
                                                                        stand.getId().toString()));
            }
        });

        List<Conference> conferences =
            this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        conferences.forEach(conference -> {
            if (conference.getStatus() == Status.VALIDATED) {

                Status oldConferenceStatus = Status.valueOf(conference.getStatus().name());
                conference.setStatus(Status.CLOSED);
                eventLogService.eventFromSystem("Conference clôturée", EventType.ACTION, EntityType.PARTICIPATION,
                                                payload.getId(), Map.of("old_status", oldConferenceStatus.name(), "id",
                                                                        conference.getId().toString()));
            }
        });

        Status oldStatus = Status.valueOf(payload.getStatus().name());
        payload.setStatus(Status.CLOSED);
        eventLogService.eventFromSystem("Participation clôturée", EventType.ACTION, EntityType.PARTICIPATION,
                                        payload.getId(), Map.of("old_status", oldStatus.name()));
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.PARTICIPATION_MARK_AS_CLOSED;
    }
}
