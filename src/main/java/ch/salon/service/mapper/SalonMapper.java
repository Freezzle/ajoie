package ch.salon.service.mapper;

import ch.salon.domain.Salon;
import ch.salon.service.dto.SalonDTO;
import ch.salon.service.dto.SalonLightDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring",uses = {AddressMapper.class, BankAccountMapper.class, PriceStandMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SalonMapper {

    SalonDTO toDto(Salon salon);

    @Mapping(target = "tenantId", ignore = true)
    Salon toEntity(SalonDTO salon);

    SalonLightDTO toLightDto(Salon salon);


    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "priceStandSalons", ignore = true)
    @Mapping(target = "archived", ignore = true)
    @Mapping(target = "sourceSalonId", ignore = true)
    void updateEntityFromDto(SalonDTO salonDTO, @MappingTarget Salon salon);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Salon toRefEntity(SalonLightDTO salon);
}
