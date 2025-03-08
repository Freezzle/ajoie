package ch.salon.service.mapper;

import ch.salon.domain.Address;
import ch.salon.service.dto.AddressDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AddressMapper {
    AddressMapper INSTANCE = Mappers.getMapper(AddressMapper.class);

    AddressDTO toDto(Address domain);

    Address toEntity(AddressDTO dto);
}
