package ch.salon.service.mapper;

import ch.salon.domain.PriceStandSalon;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.PriceStandLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface PriceStandMapper {

    PriceStandDTO toDto(PriceStandSalon priceStandSalon);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "nbSellingSide", ignore = true)
    PriceStandSalon toEntity(PriceStandDTO priceStandSalon);

    PriceStandLightDTO toLightDto(PriceStandSalon priceStandSalon);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "nbSellingSide", ignore = true)
    void updateEntityFromDto(PriceStandDTO priceStandDTO, @MappingTarget PriceStandSalon priceStand);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    PriceStandSalon toRefEntity(PriceStandLightDTO priceStandSalon);
}
