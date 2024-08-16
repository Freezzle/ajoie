package ch.salon.service;

import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.mapper.StandMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class StandService {

    public static final String ENTITY_NAME = "stand";

    private final StandRepository standRepository;
    private final ParticipationService participationService;
    private final EventLogService eventLogService;

    public StandService(StandRepository standRepository, ParticipationService participationService, EventLogService eventLogService) {
        this.standRepository = standRepository;
        this.participationService = participationService;
        this.eventLogService = eventLogService;
    }

    public UUID create(StandDTO stand) {
        if (stand.getId() != null) {
            throw new BadRequestAlertException("A new stand cannot already have an ID", ENTITY_NAME, "idexists");
        }

        Stand standCreated = standRepository.save(StandMapper.INSTANCE.toEntity(stand));
        this.eventLogService.eventFromSystem(
                "Un stand a été ajoutée.",
                EventType.EVENT,
                EntityType.PARTICIPATION,
                standCreated.getParticipation().getId()
            );
        this.participationService.adaptStatusFromChildren(standCreated.getParticipation().getId());

        return standCreated.getId();
    }

    public StandDTO update(final UUID id, StandDTO stand) {
        if (stand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, stand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Stand standExisting = standRepository.getReferenceById(id);
        if (standExisting == null) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Stand standToUpdate = StandMapper.INSTANCE.toEntity(stand);

        if (Stand.hasDifference(standToUpdate, standExisting)) {
            this.eventLogService.eventFromSystem(
                    "Des éléments d'un stand ont changé.",
                    EventType.EVENT,
                    EntityType.PARTICIPATION,
                    standExisting.getParticipation().getId()
                );
        }

        standToUpdate = standRepository.save(standToUpdate);
        this.participationService.adaptStatusFromChildren(standToUpdate.getParticipation().getId());

        return StandMapper.INSTANCE.toDto(standToUpdate);
    }

    public List<StandDTO> findAll(String idSalon, String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            return standRepository
                .findByParticipationId(UUID.fromString(idParticipation))
                .stream()
                .map(StandMapper.INSTANCE::toDto)
                .toList();
        } else if (StringUtils.isNotBlank(idSalon)) {
            return standRepository.findByParticipationSalonId(UUID.fromString(idSalon)).stream().map(StandMapper.INSTANCE::toDto).toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<StandDTO> get(UUID id) {
        return standRepository.findById(id).map(StandMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        UUID idParticipation = get(id).map(StandDTO::getParticipation).map(ParticipationLightDTO::getId).orElseThrow();
        standRepository.deleteById(id);
        this.eventLogService.eventFromSystem("Un stand a été supprimée.", EventType.EVENT, EntityType.PARTICIPATION, idParticipation);
        this.participationService.adaptStatusFromChildren(idParticipation);
    }
}
