package ch.salon.service.mapper;

import ch.salon.domain.TaskComment;
import ch.salon.service.dto.TaskCommentDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface TaskCommentMapper {

    @Mapping(target = "taskInstanceId", source = "taskInstance.id")
    TaskCommentDTO toDto(TaskComment entity);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "taskInstance", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    TaskComment toEntity(TaskCommentDTO dto);
}
