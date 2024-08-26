package ch.salon.service;

import ch.salon.domain.DimensionStand;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.service.dto.DimensionStandDTO;
import ch.salon.service.mapper.DimensionStandMapper;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DimensionStandService {

    public static final String ENTITY_NAME = "dimensionPriceStand";

    private final DimensionStandRepository dimensionStandRepository;

    public DimensionStandService(DimensionStandRepository dimensionStandRepository) {
        this.dimensionStandRepository = dimensionStandRepository;
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
}
