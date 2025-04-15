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
public class ValidateParticipationHandler implements BusinessActionHandler<Participation> {

    private final ConferenceRepository conferenceRepository;
    private final StandRepository standRepository;
    private final EventLogService eventLogService;

    public ValidateParticipationHandler(EventLogService eventLogService, StandRepository standRepository,
                                        ConferenceRepository conferenceRepository) {
        this.eventLogService = eventLogService;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
    }

    @Override
    public SupportType supports(Participation payload, Map<String, Object> context) {
        if (payload == null || payload.getStatus() != Status.ACCEPTED) {
            return SupportType.REJECTED;
        }

        if (this.standRepository.existsStandByParticipationIdAndStatusIn(payload.getId(), Status.IN_VERIFICATION)) {
            return SupportType.DISABLED;
        }

        if (this.conferenceRepository.existsStandByParticipationIdAndStatusIn(payload.getId(),
                                                                              Status.IN_VERIFICATION)) {
            return SupportType.DISABLED;
        }

        //TODO: Later, we can only validate if (accepted && arrangement) or (accepted && !arrangement && invoicing plan paid)

        return SupportType.ALLOWED;
    }

    @Override
    public void execute(Participation payload, Map<String, Object> context) {
        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        stands.forEach(stand -> {
            if (stand.getStatus() == Status.ACCEPTED) {
                Status oldStandStatus = Status.valueOf(stand.getStatus().name());
                stand.setStatus(Status.VALIDATED);
                eventLogService.eventFromSystem("Stand validé", EventType.ACTION, EntityType.PARTICIPATION,
                                                payload.getId(), Map.of("old_status", oldStandStatus.name(), "id",
                                                                        stand.getId().toString()));
            }
        });

        List<Conference> conferences =
            this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(payload.getId());

        conferences.forEach(conference -> {
            if (conference.getStatus() == Status.ACCEPTED) {

                Status oldConferenceStatus = Status.valueOf(conference.getStatus().name());
                conference.setStatus(Status.VALIDATED);
                eventLogService.eventFromSystem("Conference validée", EventType.ACTION, EntityType.PARTICIPATION,
                                                payload.getId(), Map.of("old_status", oldConferenceStatus.name(), "id",
                                                                        conference.getId().toString()));
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
