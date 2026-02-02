package ch.salon.service.mapper;

import ch.salon.domain.Salon;
import ch.salon.service.dto.SalonDTO;
import ch.salon.service.dto.SalonLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {PriceStandMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SalonMapper {

    SalonDTO toDto(Salon salon);

    @Mapping(target = "tenantId", ignore = true)
    Salon toEntity(SalonDTO salon);

    SalonLightDTO toLightDto(Salon salon);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Salon toRefEntity(SalonLightDTO salon);
}
