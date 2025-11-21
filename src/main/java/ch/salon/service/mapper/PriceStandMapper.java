package ch.salon.service.mapper;

import ch.salon.domain.PriceStandSalon;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.PriceStandLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PriceStandMapper {

    PriceStandDTO toDto(PriceStandSalon priceStandSalon);

    PriceStandSalon toEntity(PriceStandDTO priceStandSalon);

    PriceStandLightDTO toLightDto(PriceStandSalon priceStandSalon);

    @Mapping(target = "dimension", ignore = true)
    @Mapping(target = "price", ignore = true)
    @Mapping(target = "widthMeter", ignore = true)
    @Mapping(target = "heightMeter", ignore = true)
    PriceStandSalon toLightEntity(PriceStandLightDTO priceStandSalon);
}
