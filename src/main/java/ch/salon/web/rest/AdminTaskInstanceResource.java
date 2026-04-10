package ch.salon.web.rest;

import ch.salon.domain.enumeration.TaskStatus;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.TaskInstanceService;
import ch.salon.service.dto.*;
import ch.salon.utils.ResourceUtil;
import ch.salon.utils.ResponseUtil;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for managing task instances, subtask instances and task comments.
 * Also handles instantiation from templates and the Focus View.
 */
@RestController
@RequestMapping("/api/admin")
@Transactional
public class AdminTaskInstanceResource {

    private static final Logger log = LoggerFactory.getLogger(AdminTaskInstanceResource.class);
    private final TaskInstanceService taskInstanceService;

    public AdminTaskInstanceResource(TaskInstanceService taskInstanceService) {
        this.taskInstanceService = taskInstanceService;
    }

    // =========================================================================
    // Focus View
    // =========================================================================

    @GetMapping("/salons/{salonId}/tasks")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<TaskInstanceDTO> getTasksBySalon(@PathVariable("salonId") UUID salonId) {
        log.debug("REST request to get all tasks for Salon {}", salonId);
        return taskInstanceService.findAllBySalonId(salonId);
    }

    @PostMapping("/salons/{salonId}/tasks")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<TaskInstanceDTO> createTask(@PathVariable("salonId") UUID salonId,
                                                       @Valid @RequestBody TaskInstanceDTO dto) {
        log.debug("REST request to create TaskInstance for Salon {}", salonId);
        TaskInstanceDTO result = taskInstanceService.create(salonId, dto);
        return ResourceUtil.created("taskInstance", result.getId(), "/api/admin/task-instances").body(result);
    }


    // =========================================================================
    // Task Instance CRUD
    // =========================================================================

    @GetMapping("/task-instances/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<TaskInstanceDTO> getTaskInstance(@PathVariable("id") UUID id) {
        log.debug("REST request to get TaskInstance : {}", id);
        return ResponseUtil.wrapOrNotFound(taskInstanceService.get(id));
    }

    @PatchMapping("/task-instances/{id}/status")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<TaskInstanceDTO> updateTaskStatus(@PathVariable("id") UUID id,
                                                             @RequestBody Map<String, String> body) {
        log.debug("REST request to update status of TaskInstance : {}", id);
        TaskStatus newStatus = TaskStatus.valueOf(body.get("status"));
        TaskInstanceDTO result = taskInstanceService.updateStatus(id, newStatus);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/task-instances/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<TaskInstanceDTO> patchTaskInstance(@PathVariable("id") UUID id,
                                                              @RequestBody Map<String, Object> fields) {
        log.debug("REST request to patch TaskInstance : {}", id);
        TaskInstanceDTO result = taskInstanceService.patch(id, fields);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/task-instances/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteTaskInstance(@PathVariable("id") UUID id) {
        log.debug("REST request to delete TaskInstance : {}", id);
        taskInstanceService.deleteTaskInstance(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Subtask Instance
    // =========================================================================

    @PostMapping("/task-instances/{taskInstanceId}/subtasks")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SubtaskInstanceDTO> addSubtask(@PathVariable("taskInstanceId") UUID taskInstanceId,
                                                          @Valid @RequestBody SubtaskInstanceDTO dto) {
        log.debug("REST request to add SubtaskInstance to TaskInstance : {}", taskInstanceId);
        SubtaskInstanceDTO result = taskInstanceService.addSubtask(taskInstanceId, dto);
        return ResourceUtil.created("subtaskInstance", result.getId(), "/api/admin/subtask-instances").body(result);
    }

    @PatchMapping("/subtask-instances/{id}/status")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SubtaskInstanceDTO> updateSubtaskStatus(@PathVariable("id") UUID id,
                                                                    @RequestBody Map<String, String> body) {
        log.debug("REST request to update status of SubtaskInstance : {}", id);
        TaskStatus newStatus = TaskStatus.valueOf(body.get("status"));
        SubtaskInstanceDTO result = taskInstanceService.updateSubtaskStatus(id, newStatus);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/subtask-instances/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SubtaskInstanceDTO> patchSubtaskInstance(@PathVariable("id") UUID id,
                                                                    @RequestBody Map<String, Object> fields) {
        log.debug("REST request to patch SubtaskInstance : {}", id);
        SubtaskInstanceDTO result = taskInstanceService.patchSubtask(id, fields);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/subtask-instances/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteSubtaskInstance(@PathVariable("id") UUID id) {
        log.debug("REST request to delete SubtaskInstance : {}", id);
        taskInstanceService.deleteSubtaskInstance(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // Comments
    // =========================================================================

    @PostMapping("/task-instances/{taskInstanceId}/comments")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<TaskCommentDTO> addComment(@PathVariable("taskInstanceId") UUID taskInstanceId,
                                                      @Valid @RequestBody TaskCommentDTO dto) {
        log.debug("REST request to add comment to TaskInstance : {}", taskInstanceId);
        TaskCommentDTO result = taskInstanceService.addComment(taskInstanceId, dto);
        return ResourceUtil.created("taskComment", result.getId(), "/api/admin/task-comments").body(result);
    }

    @DeleteMapping("/task-comments/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteComment(@PathVariable("id") UUID id) {
        log.debug("REST request to delete TaskComment : {}", id);
        taskInstanceService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
