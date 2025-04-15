package ch.salon.service;

import ch.salon.domain.Exhibitor;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ExhibitorMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class ExhibitorService {

    public static final String ENTITY_NAME = "exhibitor";

    private final ExhibitorRepository exhibitorRepository;
    private final EventLogService eventLogService;

    public ExhibitorService(ExhibitorRepository exhibitorRepository, EventLogService eventLogService) {
        this.exhibitorRepository = exhibitorRepository;
        this.eventLogService = eventLogService;
    }

    public UUID create(ExhibitorDTO exhibitor) {
        if (exhibitor == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (exhibitor.getId() != null) {
            throw new BadRequestAlertException("A new exhibitor cannot already have an ID", ENTITY_NAME, "id.exists");
        }
        Exhibitor entity = ExhibitorMapper.INSTANCE.toEntity(exhibitor);
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

        if (!exhibitorRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return ExhibitorMapper.INSTANCE.toDto(exhibitorRepository.save(ExhibitorMapper.INSTANCE.toEntity(exhibitor)));
    }

    public List<ExhibitorDTO> findAll() {
        return exhibitorRepository.findByOrderByRegistrationDateDesc()
                                  .stream()
                                  .map(ExhibitorMapper.INSTANCE::toDto)
                                  .toList();
    }

    public Optional<ExhibitorDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return exhibitorRepository.findById(id).map(ExhibitorMapper.INSTANCE::toDto);
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

        return this.eventLogService.findAllEventLog(EntityType.EXHIBITOR, idExhibitor)
                                   .stream()
                                   .map(EventLogMapper.INSTANCE::toDto)
                                   .toList();
    }
}
