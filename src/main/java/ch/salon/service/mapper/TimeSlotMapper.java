package ch.salon.service.mapper;

import ch.salon.domain.TimeSlot;
import ch.salon.service.dto.TimeSlotDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TimeSlotMapper {
    TimeSlotMapper INSTANCE = Mappers.getMapper(TimeSlotMapper.class);

    TimeSlotDTO toDto(TimeSlot domain);

    TimeSlot toEntity(TimeSlotDTO dto);
}
