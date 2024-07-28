package ch.salon.service.mapper;

import ch.salon.domain.Salon;
import ch.salon.service.dto.SalonDTO;
import ch.salon.service.dto.SalonLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(uses = {PriceStandMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SalonMapper {
    SalonMapper INSTANCE = Mappers.getMapper(SalonMapper.class);

    SalonDTO toDto(Salon salon);

    Salon toEntity(SalonDTO salon);

    SalonLightDTO toLightDto(Salon salon);

    @Mapping(target = "place", ignore = true)
    Salon toLightEntity(SalonLightDTO salon);
}
