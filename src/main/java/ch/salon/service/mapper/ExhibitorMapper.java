package ch.salon.service.mapper;

import ch.salon.domain.Exhibitor;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ExhibitorMapper {
    ExhibitorMapper INSTANCE = Mappers.getMapper(ExhibitorMapper.class);

    ExhibitorDTO toDto(Exhibitor exhibitor);

    Exhibitor toEntity(ExhibitorDTO exhibitor);

    ExhibitorLightDTO toLightDto(Exhibitor exhibitor);

    @Mapping(target = "fullName", ignore = true)
    Exhibitor toLightEntity(ExhibitorLightDTO exhibitor);
}
