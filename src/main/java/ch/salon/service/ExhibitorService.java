package ch.salon.service;

import ch.salon.domain.Exhibitor;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import ch.salon.service.dto.ExhibitorListDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ExhibitorMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ExhibitorService {

    public static final String ENTITY_NAME = "exhibitor";

    private final ExhibitorRepository exhibitorRepository;
    private final ParticipationRepository participationRepository;
    private final EventLogService eventLogService;
    private final ExhibitorMapper exhibitorMapper;
    private final EventLogMapper eventLogMapper;

    public UUID create(ExhibitorDTO exhibitor) {
        if (exhibitor == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (exhibitor.getId() != null) {
            throw new BadRequestAlertException("A new exhibitor cannot already have an ID", ENTITY_NAME, "id.exists");
        }
        Exhibitor entity = exhibitorMapper.toEntity(exhibitor);
        entity.setRegistrationDate(Instant.now());

        return exhibitorRepository.save(entity).getId();
    }

    public ExhibitorDTO update(final UUID id, ExhibitorDTO exhibitor) {
        if (exhibitor == null || exhibitor.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, exhibitor.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Exhibitor exhibitorFound = exhibitorRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        exhibitorMapper.updateEntityFromDto(exhibitor, exhibitorFound);

        return exhibitorMapper.toDto(exhibitorFound);
    }

    public List<ExhibitorDTO> findAll() {
        return exhibitorRepository.findByOrderByRegistrationDateDesc().stream().map(exhibitorMapper::toDto)
                                  .toList();
    }

    /**
     * Clients de l'annuaire, enrichis du nombre de participations et du dernier salon.
     *
     * <p>Une seule requête groupée sur les participations : pas de N+1. Les participations
     * refusées et annulées sont exclues.</p>
     */
    public List<ExhibitorListDTO> findAllForList() {
        List<Status> discarded = List.of(Status.REFUSED, Status.CANCELED);

        Map<UUID, ExhibitorSalonSummary> summaries = new HashMap<>();

        participationRepository.findSalonsByExhibitorExcludingStatuses(discarded).forEach(row -> {
            UUID idExhibitor = (UUID) row[0];
            if (idExhibitor == null) {
                return;
            }

            ExhibitorSalonSummary summary = summaries.computeIfAbsent(idExhibitor,
                    id -> new ExhibitorSalonSummary());
            summary.count++;

            Instant startingDate = (Instant) row[2];
            if (startingDate != null && (summary.lastDate == null || startingDate.isAfter(summary.lastDate))) {
                summary.lastDate = startingDate;
                summary.lastPlace = (String) row[1];
            }
        });

        return exhibitorRepository.findByOrderByRegistrationDateDesc().stream()
                                  .map(exhibitor -> {
                                      ExhibitorListDTO dto = exhibitorMapper.toListDto(exhibitor);
                                      ExhibitorSalonSummary summary = summaries.get(exhibitor.getId());

                                      if (summary != null) {
                                          dto.setNbParticipations(summary.count);
                                          dto.setLastSalonPlace(summary.lastPlace);
                                          dto.setLastSalonDate(summary.lastDate);
                                      }

                                      return dto;
                                  })
                                  .toList();
    }

    /** Agrégat temporaire des salons d'un client. */
    private static final class ExhibitorSalonSummary {
        private long count = 0L;
        private String lastPlace;
        private Instant lastDate;
    }

    public Optional<ExhibitorDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return exhibitorRepository.findById(id).map(exhibitorMapper::toDto);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        exhibitorRepository.deleteById(id);
    }

    public List<EventLogDTO> findAllEventLogs(UUID idExhibitor) {
        if (idExhibitor == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.eventLogService.findAllEventLog(EntityType.EXHIBITOR, idExhibitor).stream()
                                   .map(eventLogMapper::toDto).toList();
    }

    public List<ExhibitorLightDTO> getExhibitorsWithActiveNewsletter() {
        return exhibitorRepository.findAllByNewsletterIsTrueAndRedFlagIsFalse().stream()
                .map(exhibitorMapper::toLightDto).toList();
    }
}
