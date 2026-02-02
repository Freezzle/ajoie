package ch.salon.service.mapper;

import ch.salon.domain.Participation;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.service.dto.ParticipationLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ExhibitorMapper.class, SalonMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ParticipationMapper {

    ParticipationDTO toDto(Participation participation);

    @Mapping(target = "tenantId", ignore = true)
    Participation toEntity(ParticipationDTO participation);

    ParticipationLightDTO toLightDto(Participation participation);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Participation toRefEntity(ParticipationLightDTO participation);
}
