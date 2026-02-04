package ch.salon.service.mapper;

import ch.salon.domain.Workshop;
import ch.salon.service.dto.WorkshopDTO;
import ch.salon.service.dto.WorkshopLightDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface WorkshopMapper {

    WorkshopDTO toDto(Workshop workshop);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    Workshop toEntity(WorkshopDTO workshop);

    WorkshopLightDTO toLightDto(Workshop workshop);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    void updateEntityFromDto(WorkshopDTO workshopDTO, @MappingTarget Workshop workshop);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Workshop toRefEntity(WorkshopLightDTO workshop);
}
