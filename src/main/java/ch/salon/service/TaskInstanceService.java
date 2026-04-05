package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.TaskStatus;
import ch.salon.repository.*;
import ch.salon.service.dto.*;
import ch.salon.service.mapper.SubtaskInstanceMapper;
import ch.salon.service.mapper.TaskCommentMapper;
import ch.salon.service.mapper.TaskInstanceMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import ch.salon.web.rest.errors.ErrorBusinessKey;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class TaskInstanceService {

    public static final String ENTITY_NAME = "taskInstance";
    private static final String SUBTASK_ENTITY_NAME = "subtaskInstance";

    private final TaskInstanceRepository taskInstanceRepository;
    private final SubtaskInstanceRepository subtaskInstanceRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final SalonRepository salonRepository;
    private final TaskInstanceMapper taskInstanceMapper;
    private final SubtaskInstanceMapper subtaskInstanceMapper;
    private final TaskCommentMapper taskCommentMapper;


    // =========================================================================
    // Create task instance
    // =========================================================================
    @Transactional
    public TaskInstanceDTO create(UUID salonId, TaskInstanceDTO dto) {
        if (dto == null) {
            throw new BadRequestAlertException("Invalid object", ENTITY_NAME, ErrorBusinessKey.OBJ_NULL);
        }
        if (salonId == null) {
            throw new BadRequestAlertException("Salon ID is required", ENTITY_NAME, ErrorBusinessKey.ID_NULL);
        }

        Salon salon = salonRepository.findById(salonId).orElseThrow(
                () -> new BadRequestAlertException("Salon not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        TaskInstance entity = taskInstanceMapper.toEntity(dto);
        entity.setSalon(salon);
        entity.setStatus(TaskStatus.PENDING);

        // Auto sort_order: max + 1
        int nextSort = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(salonId).stream()
                .mapToInt(TaskInstance::getSortOrder)
                .max().orElse(-1) + 1;
        entity.setSortOrder(nextSort);

        entity = taskInstanceRepository.save(entity);

        return enrichDto(taskInstanceMapper.toDto(entity), entity);
    }

    // =========================================================================
    // List by salon — sorted chronologically, subtasks sorted by dueDate
    // =========================================================================
    @Transactional(readOnly = true)
    public List<TaskInstanceDTO> findAllBySalonId(UUID salonId) {
        List<TaskInstance> instances = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(salonId);

        return instances.stream()
                .map(instance -> enrichDto(taskInstanceMapper.toDto(instance), instance))
                .sorted(Comparator.comparing(TaskInstanceDTO::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(TaskInstanceDTO::getSortOrder))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // Focus View
    // =========================================================================
    @Transactional(readOnly = true)
    public List<TaskFocusViewDTO> getFocusView(UUID salonId) {
        List<TaskInstance> instances = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(salonId);
        LocalDate today = LocalDate.now();

        return instances.stream().map(task -> {
            TaskFocusViewDTO dto = new TaskFocusViewDTO();
            dto.setId(task.getId());
            dto.setTitle(task.getTitle());
            dto.setStatus(task.getStatus());
            LocalDate taskDueDate = computeTaskDueDate(task);
            dto.setDueDate(taskDueDate);
            dto.setResponsible(task.getResponsible());
            dto.setSupplierInfo(task.getSupplierInfo());
            dto.setCompletedAt(task.getCompletedAt());
            dto.setSortOrder(task.getSortOrder());

            // Urgency group
            dto.setUrgencyGroup(computeUrgencyGroup(taskDueDate, task.getStatus(), today));

            // Subtask counts (RÈGLE 3 — calculated, not stored)
            List<SubtaskInstance> subtasks = task.getSubtasks();
            dto.setSubtaskCount(subtasks.size());
            dto.setSubtaskDoneCount((int) subtasks.stream()
                    .filter(s -> s.getStatus() == TaskStatus.DONE)
                    .count());

            // Next subtask: non-DONE with earliest due_date
            subtasks.stream()
                    .filter(s -> s.getStatus() != TaskStatus.DONE && s.getStatus() != TaskStatus.CANCELLED)
                    .min(Comparator.comparing(SubtaskInstance::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(SubtaskInstance::getSortOrder))
                    .ifPresent(next -> {
                        TaskFocusViewDTO.NextSubtaskDTO nextDto = new TaskFocusViewDTO.NextSubtaskDTO();
                        nextDto.setId(next.getId());
                        nextDto.setTitle(next.getTitle());
                        nextDto.setDueDate(next.getDueDate());
                        dto.setNextSubtask(nextDto);
                    });

            return dto;
        }).sorted(Comparator.comparingInt(this::urgencyGroupOrder)
                .thenComparing(TaskFocusViewDTO::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(TaskFocusViewDTO::getSortOrder))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // Detail
    // =========================================================================
    @Transactional(readOnly = true)
    public Optional<TaskInstanceDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, ErrorBusinessKey.ID_NULL);
        }
        return taskInstanceRepository.findWithSubtasksById(id).map(instance -> {
            TaskInstanceDTO dto = enrichDto(taskInstanceMapper.toDto(instance), instance);
            // Charger les commentaires séparément (évite MultipleBagFetchException)
            taskInstanceRepository.findWithCommentsById(id).ifPresent(withComments ->
                dto.setComments(withComments.getComments().stream()
                    .map(taskCommentMapper::toDto)
                    .collect(Collectors.toList()))
            );
            return dto;
        });
    }

    // =========================================================================
    // RÈGLE 2 — Status update
    // =========================================================================
    @Transactional
    public TaskInstanceDTO updateStatus(UUID id, TaskStatus newStatus) {
        TaskInstance entity = taskInstanceRepository.findWithSubtasksById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        entity.setStatus(newStatus);
        if (newStatus == TaskStatus.DONE) {
            entity.setCompletedAt(Instant.now());
        } else {
            entity.setCompletedAt(null);
        }

        return enrichDto(taskInstanceMapper.toDto(entity), entity);
    }

    @Transactional
    public TaskInstanceDTO patch(UUID id, Map<String, Object> fields) {
        TaskInstance entity = taskInstanceRepository.findWithSubtasksById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        if (fields.containsKey("title") && fields.get("title") != null) {
            entity.setTitle((String) fields.get("title"));
        }
        if (fields.containsKey("description")) {
            entity.setDescription((String) fields.get("description"));
        }
        if (fields.containsKey("responsible")) {
            entity.setResponsible((String) fields.get("responsible"));
        }
        if (fields.containsKey("supplierInfo")) {
            entity.setSupplierInfo((String) fields.get("supplierInfo"));
        }
        // dueDate et snoozedUntil ne sont pas acceptés ici — voir patchSubtask()

        return enrichDto(taskInstanceMapper.toDto(entity), entity);
    }

    // =========================================================================
    // Subtask instance — patch (titre, description, dueDate)
    // =========================================================================
    @Transactional
    public SubtaskInstanceDTO patchSubtask(UUID subtaskId, Map<String, Object> fields) {
        SubtaskInstance entity = subtaskInstanceRepository.findById(subtaskId).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", SUBTASK_ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        if (fields.containsKey("title") && fields.get("title") != null) {
            entity.setTitle((String) fields.get("title"));
        }
        if (fields.containsKey("description")) {
            entity.setDescription((String) fields.get("description"));
        }
        if (fields.containsKey("responsible")) {
            entity.setResponsible((String) fields.get("responsible"));
        }
        if (fields.containsKey("supplierInfo")) {
            entity.setSupplierInfo((String) fields.get("supplierInfo"));
        }

        // ── dueDate : FIXED ou OFFSET ──────────────────────────────────────
        String dueDateType = fields.containsKey("dueDateType")
                ? (String) fields.get("dueDateType") : entity.getDueDateType();
        if (dueDateType == null) dueDateType = "FIXED";
        entity.setDueDateType(dueDateType);

        if ("OFFSET".equals(dueDateType)) {
            Integer offset = fields.containsKey("dueDateOffset")
                    ? toInt(fields.get("dueDateOffset")) : entity.getDueDateOffset();
            validateOffset(offset);
            entity.setDueDateOffset(offset);
            entity.setDueDate(resolveOffset(entity.getTaskInstance().getSalon(), offset));
        } else {
            entity.setDueDateOffset(null);
            if (fields.containsKey("dueDate")) {
                Object val = fields.get("dueDate");
                entity.setDueDate(val != null ? LocalDate.parse((String) val) : null);
            }
        }

        // ── snoozedUntil : FIXED ou OFFSET ────────────────────────────────
        String snoozeType = fields.containsKey("snoozeUntilType")
                ? (String) fields.get("snoozeUntilType") : entity.getSnoozeUntilType();
        entity.setSnoozeUntilType(snoozeType);

        if ("OFFSET".equals(snoozeType)) {
            Integer snoozeOffset = fields.containsKey("snoozeOffset")
                    ? toInt(fields.get("snoozeOffset")) : entity.getSnoozeOffset();
            validateSnoozeOffset(snoozeOffset);
            entity.setSnoozeOffset(snoozeOffset);
            entity.setSnoozedUntil(resolveOffsetFromDate(entity.getDueDate(), entity.getTaskInstance().getSalon(), snoozeOffset));
        } else if ("FIXED".equals(snoozeType)) {
            entity.setSnoozeOffset(null);
            if (fields.containsKey("snoozedUntil")) {
                Object val = fields.get("snoozedUntil");
                entity.setSnoozedUntil(val != null ? LocalDate.parse((String) val) : null);
            }
        } else {
            // snoozeType null → effacer le snooze
            entity.setSnoozeOffset(null);
            entity.setSnoozedUntil(null);
        }

        return subtaskInstanceMapper.toDto(entity);
    }

    // =========================================================================
    // Subtask instance — add ad hoc + status
    // =========================================================================
    @Transactional
    public SubtaskInstanceDTO addSubtask(UUID taskInstanceId, SubtaskInstanceDTO dto) {
        if (dto == null) {
            throw new BadRequestAlertException("Invalid object", SUBTASK_ENTITY_NAME, ErrorBusinessKey.OBJ_NULL);
        }

        TaskInstance task = taskInstanceRepository.findWithSubtasksById(taskInstanceId).orElseThrow(
                () -> new BadRequestAlertException("Task instance not found", SUBTASK_ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        SubtaskInstance entity = subtaskInstanceMapper.toEntity(dto);
        entity.setTaskInstance(task);
        entity.setStatus(TaskStatus.PENDING);

        // ── dueDate ────────────────────────────────────────────────────────
        String dueDateType = dto.getDueDateType() != null ? dto.getDueDateType() : "FIXED";
        entity.setDueDateType(dueDateType);
        if ("OFFSET".equals(dueDateType)) {
            validateOffset(dto.getDueDateOffset());
            entity.setDueDateOffset(dto.getDueDateOffset());
            entity.setDueDate(resolveOffset(task.getSalon(), dto.getDueDateOffset()));
        } else {
            entity.setDueDate(dto.getDueDate());
        }

        // ── snoozedUntil ───────────────────────────────────────────────────
        String snoozeType = dto.getSnoozeUntilType();
        entity.setSnoozeUntilType(snoozeType);
        if ("OFFSET".equals(snoozeType)) {
            validateSnoozeOffset(dto.getSnoozeOffset());
            entity.setSnoozeOffset(dto.getSnoozeOffset());
            entity.setSnoozedUntil(resolveOffsetFromDate(entity.getDueDate(), task.getSalon(), dto.getSnoozeOffset()));
        } else if ("FIXED".equals(snoozeType)) {
            entity.setSnoozedUntil(dto.getSnoozedUntil());
        }

        // Auto sort_order: max + 1
        int nextSort = task.getSubtasks().stream()
                .mapToInt(SubtaskInstance::getSortOrder)
                .max().orElse(-1) + 1;
        entity.setSortOrder(nextSort);

        SubtaskInstance saved = subtaskInstanceRepository.save(entity);
        return subtaskInstanceMapper.toDto(saved);
    }

    @Transactional
    public SubtaskInstanceDTO updateSubtaskStatus(UUID subtaskId, TaskStatus newStatus) {
        SubtaskInstance entity = subtaskInstanceRepository.findById(subtaskId).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", SUBTASK_ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        entity.setStatus(newStatus);
        if (newStatus == TaskStatus.DONE) {
            entity.setCompletedAt(Instant.now());
        } else {
            entity.setCompletedAt(null);
        }

        return subtaskInstanceMapper.toDto(entity);
    }

    @Transactional
    public void deleteTaskInstance(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, ErrorBusinessKey.ID_NULL);
        }
        taskInstanceRepository.deleteById(id);
    }

    @Transactional
    public void deleteSubtaskInstance(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", SUBTASK_ENTITY_NAME, ErrorBusinessKey.ID_NULL);
        }
        subtaskInstanceRepository.deleteById(id);
    }

    // =========================================================================
    // Comments
    // =========================================================================
    @Transactional
    public TaskCommentDTO addComment(UUID taskInstanceId, TaskCommentDTO dto) {
        if (dto == null) {
            throw new BadRequestAlertException("Invalid object", ENTITY_NAME, ErrorBusinessKey.OBJ_NULL);
        }

        TaskInstance task = taskInstanceRepository.findWithCommentsById(taskInstanceId).orElseThrow(
                () -> new BadRequestAlertException("Task instance not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        TaskComment entity = taskCommentMapper.toEntity(dto);
        entity.setTaskInstance(task);
        entity.setCreatedAt(Instant.now());

        entity = taskCommentRepository.save(entity);

        return taskCommentMapper.toDto(entity);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Calcule la dueDate d'une tâche = min des dueDate des sous-tâches
     * dont le statut n'est pas DONE ni CANCELLED.
     * Retourne null si aucune sous-tâche active n'a de date.
     */
    private LocalDate computeTaskDueDate(TaskInstance instance) {
        LocalDate today = LocalDate.now();
        return instance.getSubtasks().stream()
                .filter(s -> s.getStatus() != TaskStatus.DONE && s.getStatus() != TaskStatus.CANCELLED)
                .filter(s -> s.getSnoozedUntil() == null || s.getSnoozedUntil().isBefore(today))
                .map(SubtaskInstance::getDueDate)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(null);
    }

    /**
     * Enrichit un TaskInstanceDTO avec la dueDate calculée et les sous-tâches triées.
     */
    private TaskInstanceDTO enrichDto(TaskInstanceDTO dto, TaskInstance instance) {
        // dueDate calculée depuis les sous-tâches actives
        dto.setDueDate(computeTaskDueDate(instance));

        // Trier les sous-tâches par dueDate (nulls en dernier), puis sortOrder
        dto.getSubtasks().sort(
            Comparator.comparing(SubtaskInstanceDTO::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                    .thenComparingInt(SubtaskInstanceDTO::getSortOrder)
        );
        return dto;
    }

    private String computeUrgencyGroup(LocalDate dueDate, TaskStatus status, LocalDate today) {
        if (dueDate == null) {
            return "LATER";
        }
        if (status == TaskStatus.DONE || status == TaskStatus.CANCELLED) {
            return "LATER";
        }
        if (dueDate.isBefore(today)) {
            return "LATE";
        }
        if (dueDate.isEqual(today)) {
            return "TODAY";
        }
        if (dueDate.isBefore(today.plusDays(8))) {
            return "THIS_WEEK";
        }
        return "LATER";
    }

    private int urgencyGroupOrder(TaskFocusViewDTO dto) {
        return switch (dto.getUrgencyGroup()) {
            case "LATE" -> 0;
            case "TODAY" -> 1;
            case "THIS_WEEK" -> 2;
            default -> 3;
        };
    }

    // =========================================================================
    // Helpers — calcul d'offset
    // =========================================================================

    /**
     * Résout un offset en jours par rapport à salon.startingDate.
     * Ex : -14 = J-14, +3 = J+3.
     */
    private LocalDate resolveOffset(Salon salon, Integer offset) {
        if (salon == null || offset == null) return null;
        LocalDate base = salon.getStartingDate()
                .atZone(ZoneId.systemDefault()).toLocalDate();
        return base.plusDays(offset);
    }

    /**
     * Résout un offset en jours par rapport à une date de base (ex : dueDate de la sous-tâche).
     * Si la date de base est null, fallback sur salon.startingDate.
     */
    private LocalDate resolveOffsetFromDate(LocalDate baseDate, Salon salon, Integer offset) {
        if (offset == null) return null;
        if (baseDate != null) return baseDate.plusDays(offset);
        return resolveOffset(salon, offset);
    }

    /** Convertit un Object JSON (Integer ou String) en Integer. */
    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Number n) return n.intValue();
        return Integer.parseInt(val.toString());
    }

    /** Valide que l'offset est dans la plage −365…+365. */
    private void validateOffset(Integer offset) {
        if (offset != null && (offset < -365 || offset > 365)) {
            throw new BadRequestAlertException(
                    "Offset must be between -365 and +365", SUBTASK_ENTITY_NAME, ErrorBusinessKey.INVALID_OFFSET);
        }
    }

    /** Valide que l'offset de snooze est strictement négatif (J-N avant la dueDate). */
    private void validateSnoozeOffset(Integer offset) {
        if (offset != null && (offset < 0 || offset > 365)) {
            throw new BadRequestAlertException(
                    "Snooze offset must be between -365 and -1", SUBTASK_ENTITY_NAME, ErrorBusinessKey.INVALID_OFFSET);
        }
    }
}
