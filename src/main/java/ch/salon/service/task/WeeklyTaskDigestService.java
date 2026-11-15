package ch.salon.service.task;

import ch.salon.domain.Salon;
import ch.salon.domain.SubtaskInstance;
import ch.salon.domain.Tenant;
import ch.salon.domain.User;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.TaskStatus;
import ch.salon.repository.SubtaskInstanceRepository;
import ch.salon.repository.TenantRepository;
import ch.salon.repository.UserRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.security.tenant.TransactionalTenantOperation;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.mail.EmailCreator;
import ch.salon.utils.SalonProperties;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WeeklyTaskDigestService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WeeklyTaskDigestService.class);
    private static final ZoneId ZONE = ZoneId.of("Europe/Zurich");
    private static final Set<TaskStatus> EXCLUDED_STATUSES = EnumSet.of(TaskStatus.DONE, TaskStatus.CANCELLED);

    private final TenantRepository tenantRepository;
    private final SubtaskInstanceRepository subtaskInstanceRepository;
    private final UserRepository userRepository;
    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;
    private final TransactionalTenantOperation transactionalOps;
    private final SalonProperties salonProperties;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public void sendWeeklyDigests(LocalDate monday) {
        List<Tenant> tenants = TenantContextHolder.runAsSystem(() -> tenantRepository.findAll());
        for (Tenant tenant : tenants) {
            try {
                TenantContextHolder.runAsTenant(tenant.getId(), () -> sendForTenant(monday));
            } catch (Exception e) {
                LOGGER.error("Problem during weekly task digest for tenant {}", tenant.getId(), e);
            }
        }
    }

    public void sendForTenant(LocalDate monday) {
        LocalDate weekEnd = monday.plusDays(6);
        Instant salonNotEndedBefore = monday.atStartOfDay(ZONE).toInstant();

        Map<UUID, SalonDigest> salons = transactionalOps.executeReadOnlyAndReturn(() -> {
            Map<UUID, SalonDigest> result = new LinkedHashMap<>();
            List<SubtaskInstance> subtasks = subtaskInstanceRepository.findOpenSubtasksForDigest(
                EXCLUDED_STATUSES,
                weekEnd,
                salonNotEndedBefore
            );

            for (SubtaskInstance subtask : subtasks) {
                Salon salon = subtask.getTaskInstance() != null ? subtask.getTaskInstance().getSalon() : null;
                if (salon == null) {
                    continue;
                }
                result.computeIfAbsent(salon.getId(), ignored -> new SalonDigest(salon, new ArrayList<>()))
                    .subtasks.add(subtask);
            }
            return result;
        });

        List<User> recipients = transactionalOps.executeReadOnlyAndReturn(() ->
            userRepository.findAllByActivatedIsTrueAndTenantMemberStatus("ACTIVE")
        );

        List<SalonSummary> salonSummaries = salons.values().stream()
            .map(salonDigest -> {
                SalonDigest.Summary summary = summarizeByDate(salonDigest.subtasks, monday, weekEnd);
                if (summary.overdue().isEmpty() && summary.week().isEmpty()) {
                    return null;
                }
                return new SalonSummary(
                    salonDigest.salon.getPlace(),
                    salonDigest.salon.getId(),
                    summary.overdue().size(),
                    summary.week().size(),
                    buildTasksLink(salonDigest.salon.getId())
                );
            })
            .filter(java.util.Objects::nonNull)
            .toList();

        if (salonSummaries.isEmpty()) {
            return;
        }

        for (User user : recipients) {
            if (user == null || StringUtils.isBlank(user.getEmail())) {
                continue;
            }

            Locale locale = resolveLocale(user);
            try {
                sendTenantEmail(user, salonSummaries, locale);
            } catch (Exception e) {
                LOGGER.error("Problem while sending weekly task digest to user {} for tenant {}", user.getId(), user.getTenantId(), e);
            }
        }

        eventLogService.eventFromSystem(
            "Récap hebdomadaire des sous-tâches envoyé pour " + salonSummaries.size() + " salon(s)",
            EventType.EMAIL,
            EntityType.SALON,
            null,
            null
        );
    }

    public boolean hasDigestForSalon(UUID salonId) {
        return !findDigestCandidatesForSalon(salonId, LocalDate.now(ZONE)).isEmpty();
    }

    public int sendForSalon(UUID salonId) {
        return sendForSalon(salonId, LocalDate.now(ZONE));
    }

    public int sendForSalon(UUID salonId, LocalDate monday) {
        List<SubtaskInstance> candidates = findDigestCandidatesForSalon(salonId, monday);
        if (candidates.isEmpty()) {
            return 0;
        }

        Salon salon = candidates.get(0).getTaskInstance() != null ? candidates.get(0).getTaskInstance().getSalon() : null;
        if (salon == null) {
            return 0;
        }

        List<User> recipients = transactionalOps.executeReadOnlyAndReturn(() ->
            userRepository.findAllByActivatedIsTrueAndTenantMemberStatus("ACTIVE")
        );

        LocalDate weekEnd = monday.plusDays(6);
        SalonDigest.Summary summary = summarizeByDate(candidates, monday, weekEnd);
        if (summary.overdue().isEmpty() && summary.week().isEmpty()) {
            return 0;
        }

        int sentCount = 0;
        for (User user : recipients) {
            if (user == null || StringUtils.isBlank(user.getEmail())) {
                continue;
            }

            Locale locale = resolveLocale(user);
            List<SubtaskDigestItem> overdueItems = toDigestItems(summary.overdue(), monday, locale);
            List<SubtaskDigestItem> weekItems = toDigestItems(summary.week(), monday, locale);
            if (overdueItems.isEmpty() && weekItems.isEmpty()) {
                continue;
            }

            try {
                sendEmail(user, salon, overdueItems, weekItems, locale);
                sentCount++;
            } catch (Exception e) {
                LOGGER.error("Problem while sending weekly task digest to salon {} for user {}", salon.getId(), user.getId(), e);
                eventLogService.eventFromSystem(
                    "Problème d'envoi : récap hebdomadaire",
                    EventType.EMAIL,
                    EntityType.SALON,
                    salon.getId(),
                    null
                );
            }
        }

        return sentCount;
    }

    public EmailMessage buildEmailMessageForSalon(UUID salonId, Locale locale) {
        LocalDate monday = LocalDate.now(ZONE);
        List<SubtaskInstance> candidates = findDigestCandidatesForSalon(salonId, monday);
        if (candidates.isEmpty()) {
            EmailMessage message = new EmailMessage();
            message.setSubject(emailCreator.getTranslatedText("email.task-weekly-digest.title", locale, ""));
            message.setRecipientsCount(0);
            return message;
        }

        Salon salon = candidates.get(0).getTaskInstance() != null ? candidates.get(0).getTaskInstance().getSalon() : null;
        if (salon == null || !salon.getId().equals(salonId)) {
            EmailMessage message = new EmailMessage();
            message.setSubject(emailCreator.getTranslatedText("email.task-weekly-digest.title", locale, ""));
            message.setRecipientsCount(0);
            return message;
        }

        SalonDigest.Summary summary = summarizeByDate(candidates, monday, monday.plusDays(6));

        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo("");
        emailMessage.setSubject(emailCreator.getTranslatedText("email.task-weekly-digest.title", locale, salon.getPlace()));
        emailMessage.setRecipientsCount(countRecipientsForSalon(salonId));

        Context context = new Context(locale);
        context.setVariable("salon", salon.getPlace());
        context.setVariable("tasksLink", buildTasksLink(salon.getId()));
        context.setVariable("overdue", toDigestItems(summary.overdue(), monday, locale));
        context.setVariable("week", toDigestItems(summary.week(), monday, locale));
        emailMessage.setBody(emailCreator.getContentHtml("task/subtask-weekly-digest", context));
        return emailMessage;
    }

    public void sendForSalon(UUID salonId, EmailMessage emailMessageTemplate) {
        if (salonId == null || emailMessageTemplate == null) {
            return;
        }

        List<User> recipients = transactionalOps.executeReadOnlyAndReturn(() ->
            userRepository.findAllByActivatedIsTrueAndTenantMemberStatus("ACTIVE")
        );

        for (User user : recipients) {
            if (user == null || StringUtils.isBlank(user.getEmail())) {
                continue;
            }
            try {
                EmailMessage message = new EmailMessage();
                message.setFrom(StringUtils.defaultIfBlank(emailMessageTemplate.getFrom(), senderEmail));
                message.setTo(user.getEmail());
                message.setSubject(StringUtils.defaultIfBlank(emailMessageTemplate.getSubject(), ""));
                message.setBody(StringUtils.defaultIfBlank(emailMessageTemplate.getBody(), ""));
                emailCreator.send(message);
            } catch (Exception e) {
                LOGGER.error("Problem while sending manual weekly task digest to user {} for salon {}", user.getId(), salonId, e);
            }
        }
    }

    private List<SubtaskInstance> findDigestCandidatesForSalon(UUID salonId, LocalDate monday) {
        LocalDate weekEnd = monday.plusDays(6);
        Instant salonNotEndedBefore = monday.atStartOfDay(ZONE).toInstant();

        return transactionalOps.executeReadOnlyAndReturn(() -> subtaskInstanceRepository.findOpenSubtasksForDigest(
            EXCLUDED_STATUSES,
            weekEnd,
            salonNotEndedBefore
        ).stream()
            .filter(subtask -> belongsToSalon(subtask, salonId))
            .toList());
    }

    private boolean belongsToSalon(SubtaskInstance subtask, UUID salonId) {
        return subtask != null
            && subtask.getTaskInstance() != null
            && subtask.getTaskInstance().getSalon() != null
            && salonId.equals(subtask.getTaskInstance().getSalon().getId());
    }

    private int countRecipientsForSalon(UUID salonId) {
        return transactionalOps.executeReadOnlyAndReturn(() -> userRepository.findAllByActivatedIsTrueAndTenantMemberStatus("ACTIVE")
            .stream()
            .filter(user -> user != null && StringUtils.isNotBlank(user.getEmail()))
            .toList()
            .size());
    }

    private void sendEmail(User user, Salon salon, List<SubtaskDigestItem> overdue, List<SubtaskDigestItem> week,
            Locale locale) throws Exception {
        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(user.getEmail());
        emailMessage.setSubject(emailCreator.getTranslatedText("email.task-weekly-digest.title", locale, salon.getPlace()));

        Context context = new Context(locale);
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("salon", salon.getPlace());
        context.setVariable("tasksLink", buildTasksLink(salon.getId()));
        context.setVariable("overdue", overdue);
        context.setVariable("week", week);
        emailMessage.setBody(emailCreator.getContentHtml("task/subtask-weekly-digest", context));

        emailCreator.send(emailMessage);
    }

    private void sendTenantEmail(User user, List<SalonSummary> salonSummaries, Locale locale) throws Exception {
        EmailMessage emailMessage = new EmailMessage();
        emailMessage.setFrom(senderEmail);
        emailMessage.setTo(user.getEmail());
        emailMessage.setSubject(emailCreator.getTranslatedText("email.task-weekly-digest.title", locale, ""));

        Context context = new Context(locale);
        context.setVariable("firstName", user.getFirstName());
        context.setVariable("salons", salonSummaries);
        emailMessage.setBody(emailCreator.getContentHtml("task/subtask-weekly-digest", context));

        emailCreator.send(emailMessage);
    }

    private String buildTasksLink(UUID salonId) {
        String baseUrl = StringUtils.removeEnd(StringUtils.defaultString(salonProperties.getMail().getBaseUrl()), "/");
        return baseUrl + "/admin/salons/" + salonId + "/tasks";
    }

    private Locale resolveLocale(User user) {
        if (StringUtils.isBlank(user.getLangKey())) {
            return Locale.FRENCH;
        }
        return Locale.forLanguageTag(user.getLangKey());
    }

    private List<SubtaskDigestItem> toDigestItems(List<SubtaskInstance> subtasks, LocalDate monday, Locale locale) {
        List<SubtaskDigestItem> items = new ArrayList<>();
        for (SubtaskInstance subtask : subtasks) {
            LocalDate effectiveDate = subtask.getSnoozedUntil() != null ? subtask.getSnoozedUntil() : subtask.getDueDate();
            if (effectiveDate == null) {
                continue;
            }
            TaskStatus status = subtask.getStatus() != null ? subtask.getStatus() : TaskStatus.PENDING;
            String statusLabel = emailCreator.getTranslatedText("task.status." + status.name(), locale);
            String dueLabel = formatDueLabel(effectiveDate, monday, locale);

            items.add(new SubtaskDigestItem(
                subtask.getTitle(),
                subtask.getTaskInstance() != null && subtask.getTaskInstance().getTitle() != null
                    ? subtask.getTaskInstance().getTitle() : "",
                subtask.getDescription(),
                subtask.getResponsible(),
                statusLabel,
                dueLabel
            ));
        }
        return items;
    }

    private String formatDueLabel(LocalDate effectiveDate, LocalDate monday, Locale locale) {
        if (effectiveDate.equals(monday.minusDays(1))) {
            return "Hier";
        }
        if (effectiveDate.equals(monday)) {
            return "Aujourd'hui";
        }
        if (effectiveDate.equals(monday.plusDays(1))) {
            return "Demain";
        }
        if (effectiveDate.isBefore(monday)) {
            String formatted = effectiveDate.format(DateTimeFormatter.ofPattern("dd.MM", locale));
            if (effectiveDate.getYear() != monday.getYear()) {
                formatted += "." + effectiveDate.getYear();
            }
            return formatted;
        }

        String formatted = effectiveDate.format(DateTimeFormatter.ofPattern("EEE dd.MM", locale));
        if (formatted.isEmpty()) {
            return formatted;
        }
        return Character.toUpperCase(formatted.charAt(0)) + formatted.substring(1);
    }

    private SalonDigest.Summary summarizeByDate(List<SubtaskInstance> subtasks, LocalDate monday, LocalDate weekEnd) {
        List<SubtaskInstance> overdue = new ArrayList<>();
        List<SubtaskInstance> week = new ArrayList<>();

        for (SubtaskInstance subtask : subtasks) {
            LocalDate effectiveDate = subtask.getSnoozedUntil() != null ? subtask.getSnoozedUntil() : subtask.getDueDate();
            if (effectiveDate == null) {
                continue;
            }
            if (effectiveDate.isBefore(monday)) {
                overdue.add(subtask);
            } else if (!effectiveDate.isAfter(weekEnd)) {
                week.add(subtask);
            }
        }

        return new SalonDigest.Summary(overdue, week);
    }

    private static final class SalonDigest {
        private final Salon salon;
        private final List<SubtaskInstance> subtasks;

        private SalonDigest(Salon salon, List<SubtaskInstance> subtasks) {
            this.salon = salon;
            this.subtasks = subtasks;
        }

            private record Summary(List<SubtaskInstance> overdue, List<SubtaskInstance> week) {}
    }

        private record SalonSummary(String salonName, UUID salonId, int overdueCount, int weekCount, String tasksLink) {}
}
