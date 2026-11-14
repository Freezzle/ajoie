package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.TaskStatus;
import ch.salon.repository.*;
import ch.salon.service.dto.*;
import ch.salon.service.mapper.SubtaskInstanceMapper;
import ch.salon.service.mapper.TaskCommentMapper;
import ch.salon.service.mapper.TaskInstanceMapper;
import ch.salon.utils.DateUtils;
import ch.salon.web.rest.errors.BadRequestAlertException;
import ch.salon.web.rest.errors.ErrorBusinessKey;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class TaskInstanceService {

    public static final String ENTITY_NAME = "taskInstance";
    private static final String SUBTASK_ENTITY_NAME = "subtaskInstance";

    /** Nombre maximal d'occurrences créées en une fois par la répétition. */
    private static final int MAX_REPEAT_COUNT = 12;
    private static final Set<String> REPEAT_UNITS = Set.of("DAY", "WEEK", "MONTH");

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
        LocalDate today = DateUtils.salonToday();

        return instances.stream().map(task -> {
            TaskFocusViewDTO dto = new TaskFocusViewDTO();
            dto.setId(task.getId());
            dto.setTitle(task.getTitle());
            LocalDate taskDueDate = computeTaskDueDate(task);
            dto.setDueDate(taskDueDate);
            dto.setResponsible(task.getResponsible());
            dto.setSupplierInfo(task.getSupplierInfo());
            dto.setSortOrder(task.getSortOrder());

            // Urgency group
            dto.setUrgencyGroup(computeUrgencyGroup(taskDueDate, today));

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
    // Patch
    // =========================================================================

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
    /**
     * Crée une sous-tâche et, si une répétition est demandée (repeatCount > 1), les
     * occurrences suivantes espacées de repeatUnit (DAY / WEEK / MONTH).
     * Les occurrences sont des sous-tâches indépendantes : aucun lien n'est conservé
     * avec la première.
     *
     * @return les sous-tâches créées, dans l'ordre chronologique.
     */
    @Transactional
    public List<SubtaskInstanceDTO> addSubtask(UUID taskInstanceId, SubtaskInstanceDTO dto) {
        if (dto == null) {
            throw new BadRequestAlertException("Invalid object", SUBTASK_ENTITY_NAME, ErrorBusinessKey.OBJ_NULL);
        }

        TaskInstance task = taskInstanceRepository.findWithSubtasksById(taskInstanceId).orElseThrow(
                () -> new BadRequestAlertException("Task instance not found", SUBTASK_ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        int occurrences = resolveRepeatCount(dto);
        String repeatUnit = resolveRepeatUnit(dto, occurrences);

        // Auto sort_order: max + 1
        int nextSort = task.getSubtasks().stream()
                .mapToInt(SubtaskInstance::getSortOrder)
                .max().orElse(-1) + 1;

        List<SubtaskInstance> toCreate = new ArrayList<>();
        SubtaskInstance first = buildSubtask(task, dto, nextSort++);
        toCreate.add(first);

        // Sans date d'échéance, la répétition n'a pas de sens : une seule occurrence.
        LocalDate base = first.getDueDate();
        if (base != null) {
            for (int n = 1; n < occurrences; n++) {
                SubtaskInstance next = buildSubtask(task, dto, nextSort++);
                shiftOccurrence(next, task.getSalon(), shiftDate(base, repeatUnit, n));
                toCreate.add(next);
            }
        }

        return subtaskInstanceRepository.saveAll(toCreate).stream()
                .map(subtaskInstanceMapper::toDto)
                .toList();
    }

    /** Construit une sous-tâche (non persistée) à partir du DTO d'ajout. */
    private SubtaskInstance buildSubtask(TaskInstance task, SubtaskInstanceDTO dto, int sortOrder) {
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

        entity.setSortOrder(sortOrder);
        return entity;
    }

    /**
     * Repositionne une occurrence sur une nouvelle date d'échéance.
     * En mode OFFSET, l'offset est recalculé pour que l'occurrence reste liée au salon ;
     * si l'offset résultant sort de la plage autorisée, l'occurrence bascule en date fixe.
     */
    private void shiftOccurrence(SubtaskInstance entity, Salon salon, LocalDate dueDate) {
        entity.setDueDate(dueDate);

        if ("OFFSET".equals(entity.getDueDateType())) {
            LocalDate salonStart = salon != null ? DateUtils.toSalonDate(salon.getStartingDate()) : null;
            long offset = salonStart != null ? ChronoUnit.DAYS.between(salonStart, dueDate) : Long.MAX_VALUE;
            if (offset >= -365 && offset <= 365) {
                entity.setDueDateOffset((int) offset);
            } else {
                entity.setDueDateType("FIXED");
                entity.setDueDateOffset(null);
            }
        }

        if ("OFFSET".equals(entity.getSnoozeUntilType()) && entity.getSnoozeOffset() != null) {
            entity.setSnoozedUntil(dueDate.plusDays(entity.getSnoozeOffset()));
        }
    }

    /** Date de la n-ième occurrence à partir de la date de la première. */
    private LocalDate shiftDate(LocalDate base, String repeatUnit, int n) {
        return switch (repeatUnit) {
            case "DAY" -> base.plusDays(n);
            case "WEEK" -> base.plusWeeks(n);
            case "MONTH" -> base.plusMonths(n);
            default -> base;
        };
    }

    /** Nombre total d'occurrences demandé : 1 par défaut, 12 au maximum. */
    private int resolveRepeatCount(SubtaskInstanceDTO dto) {
        Integer count = dto.getRepeatCount();
        if (count == null) {
            return 1;
        }
        if (count < 1 || count > MAX_REPEAT_COUNT) {
            throw new BadRequestAlertException(
                    "Repeat count must be between 1 and " + MAX_REPEAT_COUNT, SUBTASK_ENTITY_NAME,
                    ErrorBusinessKey.INVALID_REPEAT);
        }
        return count;
    }

    /** Intervalle de répétition, obligatoire et validé dès qu'il y a plusieurs occurrences. */
    private String resolveRepeatUnit(SubtaskInstanceDTO dto, int occurrences) {
        if (occurrences <= 1) {
            return null;
        }
        String unit = dto.getRepeatUnit();
        if (!REPEAT_UNITS.contains(unit)) {
            throw new BadRequestAlertException(
                    "Repeat unit must be one of " + REPEAT_UNITS, SUBTASK_ENTITY_NAME,
                    ErrorBusinessKey.INVALID_REPEAT);
        }
        return unit;
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

    @Transactional
    public void deleteComment(UUID commentId) {
        if (commentId == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, ErrorBusinessKey.ID_NULL);
        }
        taskCommentRepository.deleteById(commentId);
    }
    // =========================================================================

    /**
     * Calcule la dueDate d'une tâche = min des dueDate des sous-tâches
     * dont le statut n'est pas DONE ni CANCELLED.
     * Retourne null si aucune sous-tâche active n'a de date.
     */
    private LocalDate computeTaskDueDate(TaskInstance instance) {
        LocalDate today = DateUtils.salonToday();
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

    private String computeUrgencyGroup(LocalDate dueDate, LocalDate today) {
        if (dueDate == null) {
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
        LocalDate base = DateUtils.toSalonDate(salon.getStartingDate());
        if (base == null) return null;
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

    // =========================================================================
    // Recalculate task dates based on current salon.startingDate
    // =========================================================================

    /**
     * Vérifie si au moins une sous-tâche OFFSET du salon a une dueDate désynchronisée
     * par rapport à la startingDate actuelle du salon.
     */
    @Transactional(readOnly = true)
    public boolean hasDesynchronizedDates(UUID salonId) {
        Salon salon = salonRepository.findById(salonId).orElse(null);
        if (salon == null || salon.getStartingDate() == null) return false;

        List<TaskInstance> tasks = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(salonId);
        for (TaskInstance task : tasks) {
            for (SubtaskInstance sub : task.getSubtasks()) {
                if ("OFFSET".equals(sub.getDueDateType()) && sub.getDueDateOffset() != null) {
                    LocalDate expected = resolveOffset(salon, sub.getDueDateOffset());
                    if (!Objects.equals(sub.getDueDate(), expected)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Recalcule toutes les dates des sous-tâches du salon :
     * - OFFSET : recalcule dueDate à partir de salon.startingDate + offset
     * - FIXED  : conserve jour+mois, ajuste l'année à celle du salon cible
     * - snoozeUntilType=OFFSET : recalcule snoozedUntil
     */
    @Transactional
    public void recalculateTaskDates(UUID salonId) {
        Salon salon = salonRepository.findById(salonId).orElseThrow(
                () -> new BadRequestAlertException("Salon not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        if (salon.getStartingDate() == null) {
            throw new BadRequestAlertException("Salon has no starting date", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND);
        }

        int targetYear = DateUtils.toSalonDate(salon.getStartingDate()).getYear();

        List<TaskInstance> tasks = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(salonId);
        for (TaskInstance task : tasks) {
            for (SubtaskInstance sub : task.getSubtasks()) {
                // ── Recalcul dueDate ─────────────────────────────────────────
                if ("OFFSET".equals(sub.getDueDateType()) && sub.getDueDateOffset() != null) {
                    sub.setDueDate(resolveOffset(salon, sub.getDueDateOffset()));
                } else if ("FIXED".equals(sub.getDueDateType()) && sub.getDueDate() != null) {
                    sub.setDueDate(adjustYear(sub.getDueDate(), targetYear));
                }

                // ── Recalcul snoozedUntil ─────────────────────────────────
                if ("OFFSET".equals(sub.getSnoozeUntilType()) && sub.getSnoozeOffset() != null) {
                    sub.setSnoozedUntil(resolveOffsetFromDate(sub.getDueDate(), salon, sub.getSnoozeOffset()));
                } else if ("FIXED".equals(sub.getSnoozeUntilType()) && sub.getSnoozedUntil() != null) {
                    sub.setSnoozedUntil(adjustYear(sub.getSnoozedUntil(), targetYear));
                }

                subtaskInstanceRepository.save(sub);
            }
        }
    }

    // =========================================================================
    // Copy recurring tasks from another salon
    // =========================================================================

    /**
     * Copie les tâches récurrentes d'un salon source vers un salon cible.
     * Seules les tâches contenant au moins une sous-tâche récurrente sont dupliquées.
     * Seules les sous-tâches récurrentes sont copiées.
     * Reset : status → PENDING, completedAt → null, responsible → null,
     *         snoozedUntil/snoozeUntilType/snoozeOffset → null, pas de commentaires.
     * Dates OFFSET : recalculées par rapport au salon cible.
     * Dates FIXED  : on conserve jour+mois, on remplace l'année par celle du salon cible.
     */
    @Transactional
    public List<TaskInstanceDTO> copyRecurringTasksFromSalon(UUID targetSalonId, UUID sourceSalonId) {
        Salon targetSalon = salonRepository.findById(targetSalonId).orElseThrow(
                () -> new BadRequestAlertException("Target salon not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));
        salonRepository.findById(sourceSalonId).orElseThrow(
                () -> new BadRequestAlertException("Source salon not found", ENTITY_NAME, ErrorBusinessKey.ENTITY_NOTFOUND));

        int targetYear = DateUtils.toSalonDate(targetSalon.getStartingDate()).getYear();

        List<TaskInstance> sourceTasks = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(sourceSalonId);

        // Calcul du prochain sortOrder pour le salon cible
        int nextSort = taskInstanceRepository.findBySalonIdOrderBySortOrderAsc(targetSalonId).stream()
                .mapToInt(TaskInstance::getSortOrder)
                .max().orElse(-1) + 1;

        List<TaskInstanceDTO> createdTasks = new ArrayList<>();

        for (TaskInstance sourceTask : sourceTasks) {
            List<SubtaskInstance> recurringSubtasks = sourceTask.getSubtasks().stream()
                    .filter(s -> Boolean.TRUE.equals(s.getRecurring()))
                    .toList();

            if (recurringSubtasks.isEmpty()) {
                continue; // Skip tasks without recurring subtasks
            }

            // Clone the task
            TaskInstance newTask = new TaskInstance();
            newTask.setSalon(targetSalon);
            newTask.setTitle(sourceTask.getTitle());
            newTask.setDescription(sourceTask.getDescription());
            newTask.setSupplierInfo(sourceTask.getSupplierInfo());
            newTask.setResponsible(null); // Reset responsible
            newTask.setSortOrder(nextSort++);

            newTask = taskInstanceRepository.save(newTask);

            // Clone recurring subtasks
            int subtaskSort = 0;
            for (SubtaskInstance sourceSub : recurringSubtasks) {
                SubtaskInstance newSub = new SubtaskInstance();
                newSub.setTaskInstance(newTask);
                newSub.setTitle(sourceSub.getTitle());
                newSub.setDescription(sourceSub.getDescription());
                newSub.setSupplierInfo(sourceSub.getSupplierInfo());
                newSub.setRecurring(true);
                newSub.setDueDateType(sourceSub.getDueDateType());
                newSub.setDueDateOffset(sourceSub.getDueDateOffset());
                newSub.setSortOrder(subtaskSort++);

                // Reset fields
                newSub.setStatus(TaskStatus.PENDING);
                newSub.setCompletedAt(null);
                newSub.setResponsible(null);
                newSub.setSnoozedUntil(null);
                newSub.setSnoozeUntilType(null);
                newSub.setSnoozeOffset(null);

                // Recalculate dueDate
                if ("OFFSET".equals(sourceSub.getDueDateType()) && sourceSub.getDueDateOffset() != null) {
                    newSub.setDueDate(resolveOffset(targetSalon, sourceSub.getDueDateOffset()));
                } else if (sourceSub.getDueDate() != null) {
                    // FIXED date: keep day+month, replace year with target salon year
                    newSub.setDueDate(adjustYear(sourceSub.getDueDate(), targetYear));
                } else {
                    newSub.setDueDate(null);
                }

                subtaskInstanceRepository.save(newSub);
            }

            // Reload with subtasks for DTO enrichment
            TaskInstance saved = taskInstanceRepository.findWithSubtasksById(newTask.getId()).orElse(newTask);
            createdTasks.add(enrichDto(taskInstanceMapper.toDto(saved), saved));
        }

        return createdTasks;
    }

    /**
     * Ajuste l'année d'une date en conservant jour et mois.
     * Gère le cas du 29 février en revenant au 28.
     */
    private LocalDate adjustYear(LocalDate original, int targetYear) {
        try {
            return original.withYear(targetYear);
        } catch (java.time.DateTimeException e) {
            // Ex: 29 février dans une année non-bissextile → 28 février
            return LocalDate.of(targetYear, original.getMonth(), original.getMonth().length(java.time.Year.isLeap(targetYear)));
        }
    }
}
