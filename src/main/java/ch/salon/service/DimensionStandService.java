package ch.salon.service;

import ch.salon.domain.DimensionStand;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class DimensionStandService {

    public static final String ENTITY_NAME = "dimensionPriceStand";

    private final DimensionStandRepository dimensionStandRepository;

    public DimensionStandService(DimensionStandRepository dimensionStandRepository) {
        this.dimensionStandRepository = dimensionStandRepository;
    }

    public UUID create(DimensionStand dimensionStand) {
        if (dimensionStand.getId() != null) {
            throw new BadRequestAlertException("A new dimensionStand cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return dimensionStandRepository.save(dimensionStand).getId();
    }

    public DimensionStand update(final UUID id, DimensionStand dimensionStand) {
        if (dimensionStand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, dimensionStand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!dimensionStandRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return dimensionStandRepository.save(dimensionStand);
    }

    public List<DimensionStand> findAll() {
        return dimensionStandRepository.findAll();
    }

    public Optional<DimensionStand> get(UUID id) {
        return dimensionStandRepository.findById(id);
    }

    public void delete(UUID id) {
        dimensionStandRepository.deleteById(id);
    }
}
