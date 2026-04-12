package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class TaskInstanceDTO implements Serializable {

    private UUID id;
    private UUID salonId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String responsible;
    private String supplierInfo;
    private Integer sortOrder;
    private List<SubtaskInstanceDTO> subtasks = new ArrayList<>();
    private List<TaskCommentDTO> comments = new ArrayList<>();
}
