package ch.salon.service.mapper;

import ch.salon.domain.PriceStandSalon;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.PriceStandLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(uses = {DimensionStandMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PriceStandMapper {
    PriceStandMapper INSTANCE = Mappers.getMapper(PriceStandMapper.class);

    PriceStandDTO toDto(PriceStandSalon priceStandSalon);

    PriceStandSalon toEntity(PriceStandDTO priceStandSalon);

    PriceStandLightDTO toLightDto(PriceStandSalon priceStandSalon);

    @Mapping(target = "dimension", ignore = true)
    PriceStandSalon toLightEntity(PriceStandLightDTO priceStandSalon);
}
