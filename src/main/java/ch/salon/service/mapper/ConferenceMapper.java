package ch.salon.service.mapper;

import ch.salon.domain.Conference;
import ch.salon.service.dto.ConferenceDTO;
import ch.salon.service.dto.ConferenceLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ConferenceMapper {

    ConferenceDTO toDto(Conference conference);

    Conference toEntity(ConferenceDTO conference);

    ConferenceLightDTO toLightDto(Conference conference);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Conference toRefEntity(ConferenceLightDTO conference);
}
