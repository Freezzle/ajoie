package ch.salon.service.mapper;

import ch.salon.domain.Exhibitor;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {AddressMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ExhibitorMapper {

    ExhibitorDTO toDto(Exhibitor exhibitor);

    Exhibitor toEntity(ExhibitorDTO exhibitor);

    ExhibitorLightDTO toLightDto(Exhibitor exhibitor);

    @Mapping(target = "fullName", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "redFlag", ignore = true)
    Exhibitor toLightEntity(ExhibitorLightDTO exhibitor);
}
