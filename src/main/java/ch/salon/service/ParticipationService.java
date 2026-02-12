package ch.salon.service;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ParticipationMapper;
import ch.salon.web.rest.dto.InfoInvoice;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ParticipationService {

    public static final String ENTITY_NAME = "participation";

    private final ParticipationRepository participationRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final EventLogService eventLogService;
    private final SalonRepository salonRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;
    private final ParticipationMapper participationMapper;
    private final EventLogMapper eventLogMapper;

    public UUID create(Participation participation) {
        if (participation == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (participation.getId() != null) {
            throw new BadRequestAlertException("A new participation cannot already have an ID", ENTITY_NAME,
                    "id.exists");
        }

        if (participationRepository.findByExhibitorIdAndSalonId(participation.getExhibitor().getId(), participation.getSalon().getId()) != null) {
            throw new BadRequestAlertException("That exhibitor already participates in this event", ENTITY_NAME,
                    "exhibitor.event.exists");
        }

        Salon salonFound = salonRepository.findById(participation.getSalon().getId()).orElseThrow(
                () -> new BadRequestAlertException("No salon for the given Id", ENTITY_NAME, "idnotfound"));

        String maxNumber = participationRepository.findMaxClientNumber(salonFound.getId());
        participation.setClientNumber(Participation.incrementClientNumber(maxNumber, salonFound.getReferenceNumber()));
        UUID idParticipation = participationRepository.save(participation).getId();

        this.eventLogService.eventFromSystem("Participation crée", EventType.EVENT, EntityType.PARTICIPATION,
                idParticipation, null);

        return idParticipation;
    }

    @Transactional(readOnly = true)
    public Map<UUID, InfoInvoice> getInfoInvoicesForSalon(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid salon id", ENTITY_NAME, "idnull");
        }

        List<InvoicingPlan> invoicings = this.invoicingPlanRepository.findByParticipation_Salon_Id(idSalon);

        Map<UUID, List<InvoicingPlan>> byParticipation =
                invoicings.stream().collect(Collectors.groupingBy(ip -> ip.getParticipation().getId()));

        Map<UUID, InfoInvoice> result = new HashMap<>();

        byParticipation.forEach((participationId, plans) -> result.put(participationId, buildInfoInvoice(plans)));

        return result;
    }

    // --- PRIVATE helper pour éviter la duplication de logique ---
    private InfoInvoice buildInfoInvoice(List<InvoicingPlan> invoicings) {
        if (invoicings == null || invoicings.isEmpty()) {
            return new InfoInvoice();
        }

        InfoInvoice infoInvoice = new InfoInvoice();
        infoInvoice.setNbDraft(invoicings.stream().filter(invoicingPlan -> invoicingPlan.getState().isDraft()).count());
        infoInvoice.setNbIssued(invoicings.stream().filter(invoicingPlan -> invoicingPlan.getState() == State.ISSUED || invoicingPlan.getState() == State.IS_ISSUING).count());
        infoInvoice.setNbPaid(invoicings.stream().filter(invoicingPlan -> invoicingPlan.getState() == State.PAID).count());
        infoInvoice.setNbExpired(invoicings.stream().filter(
                invoicingPlan -> invoicingPlan.getState() == State.ISSUED &&
                        invoicingPlan.getExpirationDate() != null &&
                        Instant.now().isAfter(invoicingPlan.getExpirationDate())).count());

        return infoInvoice;
    }

    public Participation update(final UUID id, Participation participation) {
        if (id == null || participation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, participation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Participation existingParticipation = participationRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        if (!existingParticipation.getExhibitor().getId().equals(participation.getExhibitor().getId())) {
            if (participationRepository.findByExhibitorIdAndSalonId(participation.getExhibitor().getId(), participation.getSalon().getId()) != null) {
                throw new BadRequestAlertException("You cannot change the exhibitor with one who already participates in this event", ENTITY_NAME,
                        "exhibitor.event.exists");
            }
        }

        participation.setClientNumber(existingParticipation.getClientNumber());

        if (Participation.diffArrangement(participation, existingParticipation)) {
            if (participation.getNeedArrangement()) {
                this.eventLogService.eventFromSystem("Arrangement activé", EventType.EVENT,
                        EntityType.PARTICIPATION, participation.getId(), null);
            } else {
                this.eventLogService.eventFromSystem("Arrangement désactivé", EventType.EVENT,
                        EntityType.PARTICIPATION, participation.getId(), null);
            }
        }

        if (Participation.diffMeal(1, participation, existingParticipation)) {
            this.eventLogService.eventFromSystem("Nombre de repas (samedi midi) changé", EventType.EVENT,
                    EntityType.PARTICIPATION, participation.getId(),
                    Map.of("old_meal", existingParticipation.getNbMeal1().toString(), "new_meal",
                            participation.getNbMeal1().toString()));
        }

        if (Participation.diffMeal(2, participation, existingParticipation)) {
            this.eventLogService.eventFromSystem("Nombre de repas (samedi soir) changé", EventType.EVENT,
                    EntityType.PARTICIPATION, participation.getId(),
                    Map.of("old_meal", existingParticipation.getNbMeal2().toString(), "new_meal",
                            participation.getNbMeal2().toString()));
        }

        if (Participation.diffMeal(3, participation, existingParticipation)) {
            this.eventLogService.eventFromSystem("Nombre de repas (dimanche midi) changé", EventType.EVENT,
                    EntityType.PARTICIPATION, participation.getId(),
                    Map.of("old_meal", existingParticipation.getNbMeal3().toString(), "new_meal",
                            participation.getNbMeal3().toString()));
        }

        if (Participation.diffStatus(participation, existingParticipation)) {
            this.eventLogService.eventFromSystem(
                    "Le statut de la participation a changé en '" + participation.getStatus().name().toLowerCase() +
                            "'", EventType.EVENT, EntityType.PARTICIPATION, participation.getId(),
                    Map.of("old_status", existingParticipation.getStatus().name().toLowerCase()));
        }

        return participationRepository.save(participation);
    }

    public List<ParticipationDTO> getParticipationsFromExhibitor(UUID idExhibitor) {
        if (idExhibitor == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(idExhibitor).stream()
                .map(participationMapper::toDto).toList();
    }

    public List<Participation> findAll(UUID idSalon) {
        if (idSalon != null) {
            return participationRepository.findBySalonIdOrderByRegistrationDateDesc(idSalon);
        }

        throw new IllegalStateException("No filter given");
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

        return this.eventLogService.findAllEventLog(EntityType.PARTICIPATION, idParticipation).stream()
                .map(eventLogMapper::toDto).toList();
    }

    public List<String> getExhibitorEmailsWithActiveParticipations() {
        List<Status> activeStatuses = Arrays.asList(Status.ACCEPTED, Status.VALIDATED, Status.CLOSED);
        return participationRepository.findByStatusIn(activeStatuses).stream()
                .map(participation -> participation.getExhibitor().getEmail())
                .distinct()
                .sorted()
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
