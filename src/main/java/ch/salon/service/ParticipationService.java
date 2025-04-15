package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ParticipationMapper;
import ch.salon.web.rest.dto.InfoInvoice;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static ch.salon.domain.enumeration.Status.ACCEPTED;
import static ch.salon.domain.enumeration.Status.CANCELED;
import static ch.salon.domain.enumeration.Status.CLOSED;
import static ch.salon.domain.enumeration.Status.IN_VERIFICATION;
import static ch.salon.domain.enumeration.Status.REFUSED;
import static ch.salon.domain.enumeration.Status.VALIDATED;

@Service
public class ParticipationService {

    public static final String ENTITY_NAME = "participation";

    private final ParticipationRepository participationRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final EventLogService eventLogService;
    private final SalonRepository salonRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;

    public ParticipationService(ParticipationRepository participationRepository,
                                ConferenceRepository conferenceRepository, StandRepository standRepository,
                                EventLogService eventLogService, SalonRepository salonRepository,
                                InvoicingPlanRepository invoicingPlanRepository) {
        this.participationRepository = participationRepository;
        this.conferenceRepository = conferenceRepository;
        this.standRepository = standRepository;
        this.eventLogService = eventLogService;
        this.salonRepository = salonRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
    }

    public UUID create(Participation participation) {
        if (participation == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (participation.getId() != null) {
            throw new BadRequestAlertException("A new participation cannot already have an ID", ENTITY_NAME,
                                               "id.exists");
        }

        Salon salonFound = salonRepository.findById(participation.getSalon().getId())
                                          .orElseThrow(() -> new BadRequestAlertException("No salon for the given Id",
                                                                                          ENTITY_NAME, "idnotfound"));

        String maxNumber = participationRepository.findMaxClientNumber(salonFound.getId());
        participation.setClientNumber(Participation.incrementClientNumber(maxNumber, salonFound.getReferenceNumber()));
        UUID idParticipation = participationRepository.save(participation).getId();

        this.eventLogService.eventFromSystem("Participation crée", EventType.EVENT, EntityType.PARTICIPATION,
                                             idParticipation, null);

        return idParticipation;
    }

    public InfoInvoice getInfoInvoice(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        List<InvoicingPlan> invoicings = this.invoicingPlanRepository.findByParticipationIdOrderByBillingNumberDesc(id);

        if (!invoicings.isEmpty()) {
            InfoInvoice infoInvoice = new InfoInvoice();
            infoInvoice.setHasDraftInvoices(invoicings.stream()
                                                      .anyMatch(
                                                          invoicingPlan -> invoicingPlan.getState() == State.DRAFT ||
                                                                           invoicingPlan.getState() == State.ISOLATED));
            infoInvoice.setHasWaitingInvoices(
                invoicings.stream().anyMatch(invoicingPlan -> invoicingPlan.getState() == State.ISSUED));
            infoInvoice.setHasExpiredInvoices(invoicings.stream()
                                                        .anyMatch(
                                                            invoicingPlan -> invoicingPlan.getState() == State.ISSUED &&
                                                                             invoicingPlan.getExpirationDate() !=
                                                                             null && Instant.now()
                                                                                            .isAfter(
                                                                                                invoicingPlan.getExpirationDate())));

            return infoInvoice;
        }

        return new InfoInvoice();
    }

    public Participation update(final UUID id, Participation participation) {
        if (id == null || participation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, participation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Participation existingParticipation = participationRepository.findById(id)
                                                                     .orElseThrow(() -> new BadRequestAlertException(
                                                                         "Entity not found", ENTITY_NAME,
                                                                         "idnotfound"));

        if (Participation.diffArrangement(participation, existingParticipation)) {
            if (participation.getNeedArrangement()) {
                this.eventLogService.eventFromSystem("Un arrangement est activé", EventType.EVENT,
                                                     EntityType.PARTICIPATION, participation.getId(), null);
            } else {
                this.eventLogService.eventFromSystem("Un arrangement est désactivé", EventType.EVENT,
                                                     EntityType.PARTICIPATION, participation.getId(), null);
            }
        }

        if (Participation.diffMeal(1, participation, existingParticipation)) {
            this.eventLogService.eventFromSystem("Le nombre de repas du samedi midi a changé", EventType.EVENT,
                                                 EntityType.PARTICIPATION, participation.getId(),
                                                 Map.of("old_meal", existingParticipation.getNbMeal1().toString(),
                                                        "new_meal", participation.getNbMeal1().toString()));
        }

        if (Participation.diffMeal(2, participation, existingParticipation)) {
            this.eventLogService.eventFromSystem("Le nombre de repas du samedi soir a changé", EventType.EVENT,
                                                 EntityType.PARTICIPATION, participation.getId(),
                                                 Map.of("old_meal", existingParticipation.getNbMeal2().toString(),
                                                        "new_meal", participation.getNbMeal2().toString()));
        }

        if (Participation.diffMeal(3, participation, existingParticipation)) {
            this.eventLogService.eventFromSystem("Le nombre de repas du dimanche midi a changé", EventType.EVENT,
                                                 EntityType.PARTICIPATION, participation.getId(),
                                                 Map.of("old_meal", existingParticipation.getNbMeal3().toString(),
                                                        "new_meal", participation.getNbMeal3().toString()));
        }

        if (Participation.diffStatus(participation, existingParticipation)) {
            this.eventLogService.eventFromSystem(
                "Le statut de la participation a changé en '" + participation.getStatus().name().toLowerCase() + "'",
                EventType.EVENT, EntityType.PARTICIPATION, participation.getId(),
                Map.of("old_status", existingParticipation.getStatus().name().toLowerCase()));
        }

        return participationRepository.save(participation);
    }

    public List<ParticipationDTO> getParticipationsFromExhibitor(UUID idExhibitor) {
        if (idExhibitor == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(idExhibitor)
                                           .stream()
                                           .map(ParticipationMapper.INSTANCE::toDto)
                                           .toList();
    }

    public List<Participation> findAll(UUID idSalon) {
        if (idSalon != null) {
            return participationRepository.findBySalonIdOrderByRegistrationDateDesc(idSalon);
        }

        throw new IllegalStateException("No filter given");
    }

    public void adaptStatusFromChildren(UUID idParticipation) {
        if (idParticipation == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        Participation participation = participationRepository.findById(idParticipation)
                                                             .orElseThrow(
                                                                 () -> new BadRequestAlertException("Entity not found",
                                                                                                    ENTITY_NAME,
                                                                                                    "idnotfound"));
        Status currentStatus = participation.getStatus();

        List<Stand> stands = this.standRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation);
        Set<Status> standsStatus = stands.stream().map(Stand::getStatus).collect(Collectors.toSet());
        List<Conference> conferences =
            this.conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation);
        Set<Status> conferencesStatus = conferences.stream().map(Conference::getStatus).collect(Collectors.toSet());

        Status statusToChange;
        if (isAnyOf(standsStatus, conferencesStatus, IN_VERIFICATION)) {
            // If one in verification mode, so participation is still in verification
            statusToChange = IN_VERIFICATION;
        } else if (isAnyOf(standsStatus, conferencesStatus, ACCEPTED)) {
            // If one in accepted mode (and none in verification mode due to the previous condition), so participation is accepted
            statusToChange = ACCEPTED;
        } else if (isAnyOf(standsStatus, conferencesStatus, VALIDATED)) {
            // If one in validated mode (and none in verification/accepted mode due to the previous condition), so participation is validated
            statusToChange = VALIDATED;
        } else if (isAnyOf(standsStatus, conferencesStatus, CLOSED)) {
            // If one in closed mode (and none in verification/accepted/validated mode due to the previous condition), so participation is closed
            statusToChange = CLOSED;
        } else if (isAnyOf(standsStatus, conferencesStatus, REFUSED)) {
            // If one in refused mode (and none in verification/accepted/validated/closed mode due to the previous conditions), so participation is refused
            statusToChange = REFUSED;
        } else if (isAllOf(standsStatus, conferencesStatus, CANCELED)) {
            // if none in verification/accepted/refused mode, so participation is canceled
            statusToChange = CANCELED;
        } else {
            statusToChange = currentStatus;
        }

        if (currentStatus != statusToChange) {
            this.eventLogService.eventFromSystem(
                "Le statut de la participation a changé en '" + statusToChange.name().toLowerCase() + "'",
                EventType.EVENT, EntityType.PARTICIPATION, participation.getId(),
                Map.of("old_status", currentStatus.name()));

            participation.setStatus(statusToChange);

            participationRepository.save(participation);
        }
    }

    public Optional<Participation> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return participationRepository.findById(id);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        participationRepository.deleteById(id);
    }

    public List<EventLogDTO> findAllEventLogs(UUID idParticipation) {
        if (idParticipation == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.eventLogService.findAllEventLog(EntityType.PARTICIPATION, idParticipation)
                                   .stream()
                                   .map(EventLogMapper.INSTANCE::toDto)
                                   .toList();
    }

    private boolean isAllOf(Set<Status> stands, Set<Status> conferences, Status status) {
        return (stands.stream().allMatch(statusStand -> statusStand == status) &&
                conferences.stream().allMatch(statusConf -> statusConf == status));
    }

    private boolean isAnyOf(Set<Status> stands, Set<Status> conferences, Status status) {
        return (stands.stream().anyMatch(statusStand -> statusStand == status) ||
                conferences.stream().anyMatch(statusConf -> statusConf == status));
    }
}
