package ch.salon.service.mapper;

import ch.salon.domain.Exponent;
import ch.salon.service.dto.ExponentDTO;
import ch.salon.service.dto.ExponentLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ExponentMapper {
    ExponentMapper INSTANCE = Mappers.getMapper(ExponentMapper.class);

    ExponentDTO toDto(Exponent exponent);

    Exponent toEntity(ExponentDTO exponent);

    ExponentLightDTO toLightDto(Exponent exponent);

    @Mapping(target = "fullName", ignore = true)
    Exponent toLightEntity(ExponentLightDTO exponent);
}
