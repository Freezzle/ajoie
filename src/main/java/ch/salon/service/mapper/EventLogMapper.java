package ch.salon.service.mapper;

import ch.salon.domain.EventLog;
import ch.salon.service.dto.EventLogDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(uses = { ExhibitorMapper.class }, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EventLogMapper {
    EventLogMapper INSTANCE = Mappers.getMapper(EventLogMapper.class);

    EventLogDTO toDto(EventLog eventLog);

    EventLog toEntity(EventLogDTO eventLog);
}
