package ch.salon.service;

import ch.salon.domain.enumeration.EntityType;
import ch.salon.repository.EventLogRepository;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ExhibitorMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ExhibitorService {

    public static final String ENTITY_NAME = "exhibitor";

    private final ExhibitorRepository exhibitorRepository;
    private final EventLogRepository eventLogRepository;
    private final EventLogService eventLogService;

    public ExhibitorService(
        ExhibitorRepository exhibitorRepository,
        EventLogRepository eventLogRepository,
        EventLogService eventLogService
    ) {
        this.exhibitorRepository = exhibitorRepository;
        this.eventLogRepository = eventLogRepository;
        this.eventLogService = eventLogService;
    }

    public UUID create(ExhibitorDTO exhibitor) {
        if (exhibitor.getId() != null) {
            throw new BadRequestAlertException("A new exhibitor cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return exhibitorRepository.save(ExhibitorMapper.INSTANCE.toEntity(exhibitor)).getId();
    }

    public ExhibitorDTO update(final UUID id, ExhibitorDTO exhibitor) {
        if (exhibitor.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, exhibitor.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!exhibitorRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return ExhibitorMapper.INSTANCE.toDto(exhibitorRepository.save(ExhibitorMapper.INSTANCE.toEntity(exhibitor)));
    }

    public List<ExhibitorDTO> findAll() {
        return exhibitorRepository.findAll().stream().map(ExhibitorMapper.INSTANCE::toDto).toList();
    }

    public Optional<ExhibitorDTO> get(UUID id) {
        return exhibitorRepository.findById(id).map(ExhibitorMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        exhibitorRepository.deleteById(id);
    }

    public void createEventLog(UUID idExhibitor, EventLogDTO eventLogDTO) {
        this.eventLogService.eventFromUser(
                eventLogDTO.getLabel(),
                eventLogDTO.getType(),
                EntityType.EXHIBITOR,
                idExhibitor,
                eventLogDTO.getReferenceDate()
            );
    }

    public List<EventLogDTO> findAllEventLogs(UUID idExhibitor) {
        return this.eventLogService.findAllEventLog(EntityType.EXHIBITOR, idExhibitor)
            .stream()
            .map(EventLogMapper.INSTANCE::toDto)
            .toList();
    }
}
