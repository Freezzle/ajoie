package ch.salon.service.mapper;

import ch.salon.domain.Conference;
import ch.salon.service.dto.ConferenceDTO;
import ch.salon.service.dto.ConferenceLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ConferenceMapper {
    ConferenceMapper INSTANCE = Mappers.getMapper(ConferenceMapper.class);

    ConferenceDTO toDto(Conference conference);

    Conference toEntity(ConferenceDTO conference);

    ConferenceLightDTO toLightDto(Conference conference);

    @Mapping(target = "title", ignore = true)
    Conference toLightEntity(ConferenceLightDTO conference);
}
