package ch.salon.service.mapper;

import ch.salon.domain.Address;
import ch.salon.service.dto.AddressDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AddressMapper {

    AddressDTO toDto(Address domain);

    Address toEntity(AddressDTO dto);
}
