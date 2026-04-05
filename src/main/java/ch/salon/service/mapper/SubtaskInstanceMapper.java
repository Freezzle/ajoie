package ch.salon.service.mapper;

import ch.salon.domain.SubtaskInstance;
import ch.salon.service.dto.SubtaskInstanceDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface SubtaskInstanceMapper {

    @Mapping(target = "taskInstanceId", source = "taskInstance.id")
    SubtaskInstanceDTO toDto(SubtaskInstance entity);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "taskInstance", ignore = true)
    @Mapping(target = "snoozedUntil", ignore = true)
    @Mapping(target = "dueDate", ignore = true)
    SubtaskInstance toEntity(SubtaskInstanceDTO dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "taskInstance", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    @Mapping(target = "snoozedUntil", ignore = true)
    @Mapping(target = "dueDate", ignore = true)
    void updateEntityFromDto(SubtaskInstanceDTO dto, @MappingTarget SubtaskInstance entity);
}
