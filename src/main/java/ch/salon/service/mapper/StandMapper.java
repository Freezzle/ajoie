package ch.salon.service.mapper;

import ch.salon.domain.Stand;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.dto.StandLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class, PriceStandMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface StandMapper {

    StandDTO toDto(Stand stand);

    Stand toEntity(StandDTO stand);

    StandLightDTO toLightDto(Stand stand);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Stand toLightEntity(StandLightDTO stand);
}
