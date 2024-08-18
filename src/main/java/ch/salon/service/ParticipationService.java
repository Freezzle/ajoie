package ch.salon.service;

import static ch.salon.domain.enumeration.Status.*;

import ch.salon.domain.Conference;
import ch.salon.domain.Participation;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class ParticipationService {

    public static final String ENTITY_NAME = "participation";

    private final ParticipationRepository participationRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final EventLogService eventLogService;
    private final PaymentRepository paymentRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;

    public ParticipationService(
        ParticipationRepository participationRepository,
        ConferenceRepository conferenceRepository,
        StandRepository standRepository,
        EventLogService eventLogService,
        PaymentRepository paymentRepository,
        InvoicingPlanRepository invoicingPlanRepository
    ) {
        this.participationRepository = participationRepository;
        this.conferenceRepository = conferenceRepository;
        this.standRepository = standRepository;
        this.eventLogService = eventLogService;
        this.paymentRepository = paymentRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
    }

    public UUID create(Participation participation) {
        if (participation.getId() != null) {
            throw new BadRequestAlertException("A new participation cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return participationRepository.save(participation).getId();
    }

    public Participation update(final UUID id, Participation participation) {
        if (participation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, participation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }
        Participation existingParticipation = participationRepository.getReferenceById(id);
        if (existingParticipation == null) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        if (Participation.hasDifference(participation, existingParticipation)) {
            this.eventLogService.eventFromSystem(
                    "Des éléments de la participation ont changé.",
                    EventType.EVENT,
                    EntityType.PARTICIPATION,
                    participation.getId()
                );
        }

        return participationRepository.save(participation);
    }

    public List<Participation> findAll(String idSalon) {
        if (StringUtils.isNotBlank(idSalon)) {
            return participationRepository.findBySalonId(UUID.fromString(idSalon));
        }

        throw new IllegalStateException("No filter given");
    }

    public void adaptStatusFromChildren(UUID idParticipation) {
        Participation participation = participationRepository.getReferenceById(idParticipation);
        if (participation == null) {
            throw new IllegalStateException("No participation found");
        }
        Status currentStatus = participation.getStatus();

        List<Stand> stands = this.standRepository.findByParticipationId(idParticipation);
        Set<Status> standsStatus = stands.stream().map(Stand::getStatus).collect(Collectors.toSet());
        List<Conference> conferences = this.conferenceRepository.findByParticipationId(idParticipation);
        Set<Status> conferencesStatus = conferences.stream().map(Conference::getStatus).collect(Collectors.toSet());

        Status statusToChange;
        if (isAnyOf(standsStatus, conferencesStatus, IN_VERIFICATION)) {
            // If one in verification mode, so participation is still in verification
            statusToChange = IN_VERIFICATION;
        } else if (isAnyOf(standsStatus, conferencesStatus, ACCEPTED)) {
            // If one in accepted mode (and none in verification mode due to the previous condition), so participation is accepted
            statusToChange = ACCEPTED;
        } else if (isAnyOf(standsStatus, conferencesStatus, REFUSED)) {
            // If one in refused mode (and none in verification/accepted mode due to the previous conditions), so participation is refused
            statusToChange = REFUSED;
        } else if (isAllOf(standsStatus, conferencesStatus, CANCELED)) {
            // if none in verification/accepted/refused mode, so participation is canceled
            statusToChange = CANCELED;
        } else {
            statusToChange = currentStatus;
        }

        if (currentStatus != statusToChange) {
            this.eventLogService.eventFromSystem(
                    "Le statut de la participation a changé de " + currentStatus + " à " + statusToChange + ".",
                    EventType.EVENT,
                    EntityType.PARTICIPATION,
                    participation.getId()
                );
            participation.setStatus(statusToChange);
            participationRepository.save(participation);
        }
    }

    private boolean isAllOf(Set<Status> stands, Set<Status> conferences, Status status) {
        return (
            stands.stream().allMatch(statusStand -> statusStand == status) &&
            conferences.stream().allMatch(statusConf -> statusConf == status)
        );
    }

    private boolean isAnyOf(Set<Status> stands, Set<Status> conferences, Status status) {
        return (
            stands.stream().anyMatch(statusStand -> statusStand == status) ||
            conferences.stream().anyMatch(statusConf -> statusConf == status)
        );
    }

    public Optional<Participation> get(UUID id) {
        return participationRepository.findById(id);
    }

    public void delete(UUID id) {
        participationRepository.deleteById(id);
    }

    public void createEventLog(UUID idExhibitor, EventLogDTO eventLogDTO) {
        this.eventLogService.eventFromUser(
                eventLogDTO.getLabel(),
                eventLogDTO.getType(),
                EntityType.PARTICIPATION,
                idExhibitor,
                eventLogDTO.getReferenceDate()
            );
    }

    public List<EventLogDTO> findAllEventLogs(UUID idParticipation) {
        return this.eventLogService.findAllEventLog(EntityType.PARTICIPATION, idParticipation)
            .stream()
            .map(EventLogMapper.INSTANCE::toDto)
            .toList();
    }
}
