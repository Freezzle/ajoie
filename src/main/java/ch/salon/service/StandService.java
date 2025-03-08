package ch.salon.service;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.mapper.StandMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class StandService {

    public static final String ENTITY_NAME = "stand";

    private final StandRepository standRepository;
    private final ParticipationService participationService;
    private final EventLogService eventLogService;

    public StandService(StandRepository standRepository, ParticipationService participationService,
                        EventLogService eventLogService) {
        this.standRepository = standRepository;
        this.participationService = participationService;
        this.eventLogService = eventLogService;
    }

    public UUID create(StandDTO stand) {
        if (stand == null || stand.getId() != null) {
            throw new BadRequestAlertException("A new stand cannot already have an ID", ENTITY_NAME, "idexists");
        }

        Stand entity = StandMapper.INSTANCE.toEntity(stand);
        entity.setRegistrationDate(Instant.now());
        entity = standRepository.save(entity);

        this.eventLogService.eventFromSystem("Un stand a été ajoutée.", EventType.EVENT, EntityType.PARTICIPATION,
                                             entity.getParticipation().getId(), null);
        this.participationService.adaptStatusFromChildren(entity.getParticipation().getId());

        return entity.getId();
    }

    public StandDTO update(final UUID id, StandDTO stand) {
        if (stand == null || stand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, stand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Stand standExisting = standRepository.findById(id)
                                             .orElseThrow(
                                                 () -> new BadRequestAlertException("Entity not found", ENTITY_NAME,
                                                                                    "idnotfound"));

        Stand standToUpdate = StandMapper.INSTANCE.toEntity(stand);

        if (Stand.hasDifference(standToUpdate, standExisting)) {
            this.eventLogService.eventFromSystem("Des éléments d'un stand ont changé.", EventType.EVENT,
                                                 EntityType.PARTICIPATION, standExisting.getParticipation().getId(),
                                                 null);
        }

        standToUpdate = standRepository.save(standToUpdate);
        this.participationService.adaptStatusFromChildren(standToUpdate.getParticipation().getId());

        return StandMapper.INSTANCE.toDto(standToUpdate);
    }

    public List<StandDTO> findAll(UUID idSalon, UUID idParticipation) {
        if (idParticipation != null) {
            return standRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation)
                                  .stream()
                                  .map(StandMapper.INSTANCE::toDto)
                                  .toList();
        } else if (idSalon != null) {
            return standRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(idSalon)
                                  .stream()
                                  .map(StandMapper.INSTANCE::toDto)
                                  .toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<StandDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return standRepository.findById(id).map(StandMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        UUID idParticipation = get(id).map(StandDTO::getParticipation).map(ParticipationLightDTO::getId).orElseThrow();
        standRepository.deleteById(id);
        this.eventLogService.eventFromSystem("Un stand a été supprimée.", EventType.EVENT, EntityType.PARTICIPATION,
                                             idParticipation, null);
        this.participationService.adaptStatusFromChildren(idParticipation);
    }
}
