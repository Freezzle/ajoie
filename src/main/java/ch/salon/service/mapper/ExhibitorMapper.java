package ch.salon.service.mapper;

import ch.salon.domain.Exhibitor;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring",uses = {AddressMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface ExhibitorMapper {

    ExhibitorDTO toDto(Exhibitor exhibitor);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    Exhibitor toEntity(ExhibitorDTO exhibitor);

    ExhibitorLightDTO toLightDto(Exhibitor exhibitor);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "registrationDate", ignore = true)
    void updateEntityFromDto(ExhibitorDTO exhibitorDTO, @MappingTarget Exhibitor exhibitor);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Exhibitor toRefEntity(ExhibitorLightDTO exhibitor);
}
