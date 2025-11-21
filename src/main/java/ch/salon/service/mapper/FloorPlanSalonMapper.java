package ch.salon.service.mapper;

import ch.salon.domain.FloorPlanSalon;
import ch.salon.service.dto.FloorPlanSalonDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FloorPlanSalonMapper {

    FloorPlanSalonDTO toDto(FloorPlanSalon stand);

    @Mapping(target = "salon", ignore = true)
    FloorPlanSalon toEntity(FloorPlanSalonDTO stand);
}
