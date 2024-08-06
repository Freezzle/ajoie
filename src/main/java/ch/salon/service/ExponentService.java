package ch.salon.service;

import ch.salon.domain.Exponent;
import ch.salon.repository.ExponentRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class ExponentService {

    public static final String ENTITY_NAME = "exponent";

    private final ExponentRepository exponentRepository;

    public ExponentService(ExponentRepository exponentRepository) {
        this.exponentRepository = exponentRepository;
    }

    public UUID create(Exponent exponent) {
        if (exponent.getId() != null) {
            throw new BadRequestAlertException("A new exponent cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return exponentRepository.save(exponent).getId();
    }

    public Exponent update(final UUID id, Exponent exponent) {
        if (exponent.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, exponent.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!exponentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return exponentRepository.save(exponent);
    }

    public List<Exponent> findAll() {
        return exponentRepository.findAll();
    }

    public Optional<Exponent> get(UUID id) {
        return exponentRepository.findById(id);
    }

    public void delete(UUID id) {
        exponentRepository.deleteById(id);
    }
}
