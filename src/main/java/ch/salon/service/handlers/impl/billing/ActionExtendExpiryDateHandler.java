package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionExtendExpiryDateHandler implements BusinessActionHandler<InvoicingPlan> {

    private final EventLogService eventLogService;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null && payload.getState() == State.ISSUED ? SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        LocalDateTime dateLimite = (LocalDateTime) context.getOrDefault("date_expiration", LocalDateTime.now().plusDays(30));

        payload.setExpirationDate(dateLimite.toInstant(ZoneOffset.UTC));

        eventLogService.eventFromSystem("Facture prolongée", EventType.ACTION, EntityType.INVOICE_PLAN,
                payload.getId(), null);
        eventLogService.eventFromSystem("Facture prolongée " + payload.getBillingNumber(),
                EventType.ACTION, EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_EXTEND_EXPIRY_DATE;
    }
}
