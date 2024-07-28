package ch.salon.service.mapper;

import ch.salon.domain.Participation;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.service.dto.ParticipationLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(uses = {ExhibitorMapper.class, SalonMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ParticipationMapper {
    ParticipationMapper INSTANCE = Mappers.getMapper(ParticipationMapper.class);

    ParticipationDTO toDto(Participation participation);

    Participation toEntity(ParticipationDTO participation);

    ParticipationLightDTO toLightDto(Participation participation);

    Participation toLightEntity(ParticipationLightDTO participation);
}
