package ch.salon.service;

import ch.salon.domain.Exhibitor;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ExhibitorMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ExhibitorService {

    public static final String ENTITY_NAME = "exhibitor";

    private final ExhibitorRepository exhibitorRepository;
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
        return exhibitorRepository.findAllByNewsletterIsTrue().stream().map(exhibitorMapper::toLightDto)
                .toList();
    }
}
