package ch.salon.service.mapper;

import ch.salon.domain.Address;
import ch.salon.service.dto.AddressDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface AddressMapper {

    AddressDTO toDto(Address domain);

    @Mapping(target = "tenantId", ignore = true)
    Address toEntity(AddressDTO dto);
}
