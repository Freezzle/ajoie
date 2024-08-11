package ch.salon.service;

import ch.salon.repository.ExponentRepository;
import ch.salon.service.dto.ExponentDTO;
import ch.salon.service.mapper.ExponentMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ExponentService {

    public static final String ENTITY_NAME = "exponent";

    private final ExponentRepository exponentRepository;

    public ExponentService(ExponentRepository exponentRepository) {
        this.exponentRepository = exponentRepository;
    }

    public UUID create(ExponentDTO exponent) {
        if (exponent.getId() != null) {
            throw new BadRequestAlertException("A new exponent cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return exponentRepository.save(ExponentMapper.INSTANCE.toEntity(exponent)).getId();
    }

    public ExponentDTO update(final UUID id, ExponentDTO exponent) {
        if (exponent.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, exponent.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!exponentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return ExponentMapper.INSTANCE.toDto(exponentRepository.save(ExponentMapper.INSTANCE.toEntity(exponent)));
    }

    public List<ExponentDTO> findAll() {
        return exponentRepository.findAll().stream().map(ExponentMapper.INSTANCE::toDto).toList();
    }

    public Optional<ExponentDTO> get(UUID id) {
        return exponentRepository.findById(id).map(ExponentMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        exponentRepository.deleteById(id);
    }
}
