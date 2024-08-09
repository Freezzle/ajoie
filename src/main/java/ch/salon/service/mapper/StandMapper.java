package ch.salon.service.mapper;

import ch.salon.domain.Stand;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.dto.StandLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface StandMapper {
    StandMapper INSTANCE = Mappers.getMapper(StandMapper.class);

    StandDTO toDto(Stand stand);

    Stand toEntity(StandDTO stand);

    StandLightDTO toLightDto(Stand stand);

    @Mapping(target = "description", ignore = true)
    Stand toLightEntity(StandLightDTO stand);
}
