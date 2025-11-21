package ch.salon.service;

import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.dto.WorkshopDTO;
import ch.salon.service.mapper.WorkshopMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import static ch.salon.web.rest.errors.ErrorBusinessKey.ENTITY_NOTFOUND;
import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_EXISTS;
import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_INVALID;
import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.OBJ_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.PARTICIPATION_LINK_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.PARTICIPATION_NOTFOUND;

@Service
@AllArgsConstructor
public class WorkshopService {

    public static final String ENTITY_NAME = "workshop";

    private final WorkshopRepository workshopRepository;
    private final ParticipationService participationService;
    private final EventLogService eventLogService;
    private final WorkshopMapper workshopMapper;

    public UUID create(WorkshopDTO workshop) {
        if (workshop == null) {
            throw new BadRequestAlertException("A new workshop must not be null", ENTITY_NAME, OBJ_NULL);
        }

        if (workshop.getId() != null) {
            throw new BadRequestAlertException("A new workshop cannot already have an ID", ENTITY_NAME, ID_EXISTS);
        }

        if (workshop.getParticipation() == null || workshop.getParticipation().getId() == null) {
            throw new BadRequestAlertException("A new workshop must be attached to a participation", ENTITY_NAME,
                    PARTICIPATION_LINK_NULL);
        }

        if (participationService.get(workshop.getParticipation().getId()).isEmpty()) {
            throw new BadRequestAlertException("Participation does not exist", ENTITY_NAME, PARTICIPATION_NOTFOUND);
        }

        Workshop entity = workshopMapper.toEntity(workshop);
        entity.setRegistrationDate(Instant.now());
        entity = workshopRepository.save(entity);

        this.eventLogService.eventFromSystem("Un atelier a été ajouté", EventType.EVENT, EntityType.PARTICIPATION,
                entity.getParticipation().getId(), null);

        return entity.getId();
    }

    public WorkshopDTO update(final UUID id, WorkshopDTO workshop) {
        if (workshop == null) {
            throw new BadRequestAlertException("A workshop must not be null", ENTITY_NAME, OBJ_NULL);
        }

        if (id == null || workshop.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, ID_NULL);
        }

        if (!Objects.equals(id, workshop.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, ID_INVALID);
        }

        Workshop workshopExisting = this.workshopRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, ENTITY_NOTFOUND));

        Workshop workshopToUpdate = workshopMapper.toEntity(workshop);

        if (Workshop.diffStatus(workshopToUpdate, workshopExisting)) {
            this.eventLogService.eventFromSystem(
                    "Le statut d'un atelier a changé en '" + workshopToUpdate.getStatus().name().toLowerCase() +
                            "'", EventType.EVENT, EntityType.PARTICIPATION, workshopExisting.getParticipation().getId(),
                    Map.of("old_status", workshopExisting.getStatus().name()));
        }

        workshopToUpdate.setRegistrationDate(workshopExisting.getRegistrationDate());
        workshopToUpdate = workshopRepository.save(workshopToUpdate);

        return workshopMapper.toDto(workshopToUpdate);
    }

    public List<WorkshopDTO> findAll(UUID idSalon, UUID idParticipation) {
        if (idParticipation != null) {
            return workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation).stream()
                                     .map(workshopMapper::toDto).toList();
        } else if (idSalon != null) {
            return workshopRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(idSalon).stream()
                                     .map(workshopMapper::toDto).toList();
        } else {
            throw new IllegalStateException("No filter given");
        }
    }

    public Optional<WorkshopDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Id null", ENTITY_NAME, ID_NULL);
        }

        return workshopRepository.findById(id).map(workshopMapper::toDto);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Id null", ENTITY_NAME, ID_NULL);
        }

        UUID idParticipation =
                get(id).map(WorkshopDTO::getParticipation).map(ParticipationLightDTO::getId).orElseThrow();

        workshopRepository.deleteById(id);
        this.eventLogService.eventFromSystem("Atelier supprimé.", EventType.EVENT,
                EntityType.PARTICIPATION, idParticipation, null);
    }
}
