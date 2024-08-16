package ch.salon.service;

import ch.salon.domain.DimensionStand;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.service.dto.DimensionStandDTO;
import ch.salon.service.mapper.DimensionStandMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class DimensionStandService {

    public static final String ENTITY_NAME = "dimensionPriceStand";

    private final DimensionStandRepository dimensionStandRepository;

    public DimensionStandService(DimensionStandRepository dimensionStandRepository) {
        this.dimensionStandRepository = dimensionStandRepository;
    }

    public UUID create(DimensionStandDTO dimensionStand) {
        if (dimensionStand.getId() != null) {
            throw new BadRequestAlertException("A new dimensionStand cannot already have an ID", ENTITY_NAME,
                "idexists");
        }

        return dimensionStandRepository.save(DimensionStandMapper.INSTANCE.toEntity(dimensionStand)).getId();
    }

    public DimensionStandDTO update(final UUID id, DimensionStandDTO dimensionStand) {
        if (dimensionStand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, dimensionStand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!dimensionStandRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return DimensionStandMapper.INSTANCE.toDto(
            dimensionStandRepository.save(DimensionStandMapper.INSTANCE.toEntity(dimensionStand)));
    }

    public List<DimensionStandDTO> findAll() {
        List<DimensionStand> dimensionStands = dimensionStandRepository.findAll();
        if (dimensionStands.isEmpty()) {
            dimensionStands.add(new DimensionStand("2 m x 2 m"));
            dimensionStands.add(new DimensionStand("2.5 m x 2 m"));
            dimensionStands.add(new DimensionStand("2.5 m x 2 m (possible de vendre des deux côtés)"));
            dimensionStands.add(new DimensionStand("3 m x 2 m"));
            dimensionStands.add(new DimensionStand("3 m x 2.5 m"));
            dimensionStands.add(new DimensionStand("4 m x 2 m"));
            dimensionStands.add(new DimensionStand("Autres"));

            dimensionStands = dimensionStandRepository.saveAll(dimensionStands);
        }
        return dimensionStands.stream().map(DimensionStandMapper.INSTANCE::toDto).toList();
    }

    public Optional<DimensionStandDTO> get(UUID id) {
        return dimensionStandRepository.findById(id).map(DimensionStandMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        dimensionStandRepository.deleteById(id);
    }
}
