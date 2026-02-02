package ch.salon.service.mapper;

import ch.salon.domain.PriceStandSalon;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.PriceStandLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PriceStandMapper {

    PriceStandDTO toDto(PriceStandSalon priceStandSalon);

    PriceStandSalon toEntity(PriceStandDTO priceStandSalon);

    PriceStandLightDTO toLightDto(PriceStandSalon priceStandSalon);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    PriceStandSalon toLightEntity(PriceStandLightDTO priceStandSalon);
}
