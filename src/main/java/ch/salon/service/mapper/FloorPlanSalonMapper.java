package ch.salon.service.mapper;

import ch.salon.domain.FloorPlanSalon;
import ch.salon.service.dto.FloorPlanSalonDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper
public interface FloorPlanSalonMapper {
    FloorPlanSalonMapper INSTANCE = Mappers.getMapper(FloorPlanSalonMapper.class);

    FloorPlanSalonDTO toDto(FloorPlanSalon stand);

    @Mapping(target = "salon", ignore = true)
    FloorPlanSalon toEntity(FloorPlanSalonDTO stand);
}
