package ch.salon.service.mapper;

import ch.salon.domain.TaskInstance;
import ch.salon.service.dto.TaskInstanceDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {SubtaskInstanceMapper.class, TaskCommentMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TaskInstanceMapper {

    @Mapping(target = "salonId", source = "salon.id")
    TaskInstanceDTO toDto(TaskInstance entity);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "salon", ignore = true)
    @Mapping(target = "subtasks", ignore = true)
    @Mapping(target = "comments", ignore = true)
    TaskInstance toEntity(TaskInstanceDTO dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "salon", ignore = true)
    @Mapping(target = "subtasks", ignore = true)
    @Mapping(target = "comments", ignore = true)
    void updateEntityFromDto(TaskInstanceDTO dto, @MappingTarget TaskInstance entity);
}
