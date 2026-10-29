package ch.salon.service.volunteer;

import ch.salon.domain.Salon;
import ch.salon.domain.VolunteerAvailabilityDay;
import ch.salon.domain.VolunteerPlanningCategory;
import ch.salon.domain.VolunteerPlanningConfiguration;
import ch.salon.domain.VolunteerPlanningDay;
import ch.salon.domain.VolunteerRegistration;
import ch.salon.domain.VolunteerTimeRange;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.ZoneMode;
import ch.salon.repository.PlanningVolunteerSalonRepository;
import ch.salon.repository.VolunteerRegistrationRepository;
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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Envoi des e-mails d'inscription bénévole (reçue, modifiée, désinscription) avec le lien
 * personnel de gestion. Tutoiement, même style en ligne que les e-mails exposant.
 */
@Service
@RequiredArgsConstructor
public class VolunteerRegistrationEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(VolunteerRegistrationEmailService.class);

    private final EmailCreator emailCreator;
    private final EventLogService eventLogService;
    private final VolunteerRegistrationRepository registrationRepository;
    private final PlanningVolunteerSalonRepository planningRepository;
    private final TransactionalTenantOperation transactionalOps;
    private final SalonProperties salonProperties;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public String buildManageLink(UUID salonId, UUID registrationId, String token) {
        String baseUrl = StringUtils.removeEnd(StringUtils.defaultString(salonProperties.getMail().getBaseUrl()), "/");
        return baseUrl + "/benevoles/" + salonId + "/mon-inscription/" + registrationId + "/" + token;
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void sendReceived(UUID tenantId, UUID registrationId, UUID salonId) {
        send(tenantId, registrationId, salonId, "volunteer/received",
                "email.volunteer-registration-received.title", true);
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void sendUpdated(UUID tenantId, UUID registrationId, UUID salonId) {
        send(tenantId, registrationId, salonId, "volunteer/updated",
                "email.volunteer-registration-updated.title", true);
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void sendCancelled(UUID tenantId, UUID registrationId, UUID salonId) {
        send(tenantId, registrationId, salonId, "volunteer/cancelled",
                "email.volunteer-registration-cancelled.title", false);
    }

    private void send(UUID tenantId, UUID registrationId, UUID salonId, String template, String subjectKey,
            boolean withLink) {
        TenantContextHolder.runAsTenant(tenantId, () -> transactionalOps.execute(() -> {
            VolunteerRegistration registration = registrationRepository.findById(registrationId).orElse(null);
            if (registration == null || registration.getSalon() == null) {
                LOGGER.warn("Inscription bénévole {} introuvable, aucun e-mail envoyé", registrationId);
                return;
            }

            Salon salon = registration.getSalon();
            Locale locale = Locale.FRENCH;

            try {
                EmailMessage emailMessage = new EmailMessage();
                emailMessage.setFrom(senderEmail);
                emailMessage.setTo(registration.getEmail());
                emailMessage.setSubject(emailCreator.getTranslatedText(subjectKey, locale, salon.getPlace()));

                Context context = new Context(locale);
                context.setVariable("firstName", registration.getFirstName());
                context.setVariable("salon", salon.getPlace());
                context.setVariable("days", buildDayLines(salon, registration));
                context.setVariable("zones", buildZoneLine(salon, registration));
                context.setVariable("closingDate", formatDate(salon.getVolunteerRegistrationClosingDate()));
                if (withLink) {
                    context.setVariable("manageLink",
                            buildManageLink(salonId, registrationId, registration.getToken()));
                }
                emailMessage.setBody(emailCreator.getContentHtml(template, context));

                emailCreator.send(emailMessage, null);

                eventLogService.eventFromSystem("E-mail inscription bénévole envoyé (" + template + ")",
                        EventType.EMAIL, EntityType.SALON, salonId, null);
            } catch (Exception e) {
                LOGGER.error("Problème d'envoi de l'e-mail bénévole : {}", template, e);
                eventLogService.eventFromSystem("Problème d'envoi e-mail bénévole : " + template, EventType.EMAIL,
                        EntityType.SALON, salonId, null);
            }
        }));
    }

    private List<String> buildDayLines(Salon salon, VolunteerRegistration registration) {
        VolunteerPlanningConfiguration config = loadConfig(salon.getId());
        List<String> lines = new ArrayList<>();
        if (config == null) {
            return lines;
        }
        for (VolunteerPlanningDay day : config.getDays()) {
            String label = StringUtils.defaultIfBlank(day.getDate(), day.getLabel());
            VolunteerAvailabilityDay avail = registration.getAvailability().stream()
                    .filter(a -> a.getDayId().equals(day.getId())).findFirst().orElse(null);
            if (avail == null || !avail.isAvailable() || avail.getRanges().isEmpty()) {
                lines.add(label + " : pas disponible");
            } else {
                String ranges = avail.getRanges().stream()
                        .map(r -> r.getStart() + "–" + r.getEnd())
                        .collect(Collectors.joining(", "));
                lines.add(label + " : " + ranges);
            }
        }
        return lines;
    }

    private String buildZoneLine(Salon salon, VolunteerRegistration registration) {
        if (registration.getZoneMode() == ZoneMode.ANY || registration.getCategoryIds().isEmpty()) {
            return "là où on a besoin de moi";
        }
        VolunteerPlanningConfiguration config = loadConfig(salon.getId());
        if (config == null) {
            return "";
        }
        return config.getCategories().stream()
                .filter(c -> registration.getCategoryIds().contains(c.getId()))
                .map(VolunteerPlanningCategory::getLabel)
                .collect(Collectors.joining(", "));
    }

    private VolunteerPlanningConfiguration loadConfig(UUID salonId) {
        return Optional.ofNullable(planningRepository.findBySalonId(salonId))
                .map(p -> p.getConfiguration()).orElse(null);
    }

    private String formatDate(java.time.Instant instant) {
        if (instant == null) {
            return "";
        }
        return java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy")
                .withZone(java.time.ZoneId.systemDefault()).format(instant);
    }
}
