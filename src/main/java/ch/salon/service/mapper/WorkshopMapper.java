package ch.salon.service.mapper;

import ch.salon.domain.Workshop;
import ch.salon.service.dto.WorkshopDTO;
import ch.salon.service.dto.WorkshopLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(uses = {ParticipationMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface WorkshopMapper {
    WorkshopMapper INSTANCE = Mappers.getMapper(WorkshopMapper.class);

    WorkshopDTO toDto(Workshop workshop);

    Workshop toEntity(WorkshopDTO workshop);

    WorkshopLightDTO toLightDto(Workshop workshop);

    @Mapping(target = "title", ignore = true)
    Workshop toLightEntity(WorkshopLightDTO workshop);
}
