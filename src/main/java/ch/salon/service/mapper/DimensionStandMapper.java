package ch.salon.service.mapper;

import ch.salon.domain.DimensionStand;
import ch.salon.service.dto.DimensionStandDTO;
import ch.salon.service.dto.DimensionStandLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper
public interface DimensionStandMapper {
    DimensionStandMapper INSTANCE = Mappers.getMapper(DimensionStandMapper.class);

    DimensionStandDTO toDto(DimensionStand dimensionStand);

    DimensionStand toEntity(DimensionStandDTO dimensionStand);

    DimensionStandLightDTO toLightDto(DimensionStand dimensionStand);

    @Mapping(target = "dimension", ignore = true)
    DimensionStand toLightEntity(DimensionStandLightDTO dimensionStand);
}
