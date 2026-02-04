package ch.salon.service.mapper;

import ch.salon.domain.Stand;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.dto.StandLightDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class, PriceStandMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface StandMapper {

    StandDTO toDto(Stand stand);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    Stand toEntity(StandDTO stand);

    StandLightDTO toLightDto(Stand stand);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    void updateEntityFromDto(StandDTO standDTO, @MappingTarget Stand stand);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Stand toRefEntity(StandLightDTO stand);
}
