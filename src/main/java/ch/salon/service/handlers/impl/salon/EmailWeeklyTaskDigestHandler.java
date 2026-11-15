package ch.salon.service.handlers.impl.salon;

import ch.salon.domain.Salon;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.task.WeeklyTaskDigestService;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class EmailWeeklyTaskDigestHandler implements EmailActionHandler<Salon>, ActionMetadataProvider {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WeeklyTaskDigestService weeklyTaskDigestService;

    @Autowired
    @Lazy
    private EmailWeeklyTaskDigestHandler self;

    @Override
    public ActionSupport supports(Salon payload, Map<String, Object> context) {
        if (payload == null || payload.getId() == null) {
            return ActionSupport.rejected();
        }

        return ActionSupport.fromConditions(
            "action.salon-weekly-task-digest-email.help",
            ConditionalKey.of(weeklyTaskDigestService.hasDigestForSalon(payload.getId()),
                "action.salon-weekly-task-digest-email.condition.has-digest")
        );
    }

    @Override
    public EmailMessage buildTemplate(Salon payload, Map<String, Object> context) {
        Locale locale = (Locale) context.getOrDefault("locale", Locale.FRENCH);
        return weeklyTaskDigestService.buildEmailMessageForSalon(payload.getId(), locale);
    }

    @Override
    public void handle(Salon payload, Map<String, Object> context) throws Exception {
        self.sendInTenant(payload.getId(), context, payload.getTenantId());
    }

    @Async
    @Transactional(propagation = Propagation.SUPPORTS)
    public void sendInTenant(UUID salonId, Map<String, Object> context, UUID tenantId) {
        TenantContextHolder.runAsTenant(tenantId, () -> {
            Object raw = context.get("emailMessage");
            EmailMessage emailMessage = raw == null ? null : objectMapper.convertValue(raw, EmailMessage.class);
            if (emailMessage == null) {
                emailMessage = weeklyTaskDigestService.buildEmailMessageForSalon(salonId, Locale.FRENCH);
            }
            weeklyTaskDigestService.sendForSalon(salonId, emailMessage);
            return null;
        });
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.SALON_WEEKLY_TASK_DIGEST_EMAIL;
    }
}
