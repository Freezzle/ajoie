package ch.salon.service.dto;

import ch.salon.domain.enumeration.TaskStatus;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Optimized DTO for the Focus View — avoids N+1 queries.
 */
@Data
public class TaskFocusViewDTO implements Serializable {

    private UUID id;
    private String title;
    private TaskStatus status;
    private LocalDate dueDate;
    private String urgencyGroup; // "LATE" | "TODAY" | "THIS_WEEK" | "LATER"
    private String responsible;
    private String supplierInfo;
    private int subtaskCount;
    private int subtaskDoneCount;
    private NextSubtaskDTO nextSubtask;
    private Instant completedAt;
    private Integer sortOrder;

    @Data
    public static class NextSubtaskDTO implements Serializable {
        private UUID id;
        private String title;
        private LocalDate dueDate;
    }
}
