package ch.salon.service.mapper;

import ch.salon.domain.Workshop;
import ch.salon.service.dto.WorkshopDTO;
import ch.salon.service.dto.WorkshopLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface WorkshopMapper {

    WorkshopDTO toDto(Workshop workshop);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    Workshop toEntity(WorkshopDTO workshop);

    WorkshopLightDTO toLightDto(Workshop workshop);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Workshop toRefEntity(WorkshopLightDTO workshop);
}
