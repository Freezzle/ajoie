package ch.salon.service.mapper;

import ch.salon.domain.EventLog;
import ch.salon.service.dto.EventLogDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ExhibitorMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EventLogMapper {

    EventLogDTO toDto(EventLog eventLog);

    EventLog toEntity(EventLogDTO eventLog);
}
