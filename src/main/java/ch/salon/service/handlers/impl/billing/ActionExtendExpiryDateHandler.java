package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.RequiredField;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.FieldType;
import ch.salon.service.handlers.enums.SupportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionExtendExpiryDateHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null && payload.getState() == State.ISSUED ? SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        Instant dateExpiration;

        Object dateObj = context.get("date_expiration");
        if (dateObj instanceof String) {
            // Parser la date ISO 8601 depuis le frontend (format: 2026-02-17T23:00:00.000Z)
            dateExpiration = Instant.parse((String) dateObj);
        } else if (dateObj instanceof LocalDateTime) {
            dateExpiration = ((LocalDateTime) dateObj).toInstant(ZoneOffset.UTC);
        } else if (dateObj instanceof Instant) {
            dateExpiration = (Instant) dateObj;
        } else {
            // Valeur par défaut si aucune date fournie
            dateExpiration = LocalDateTime.now().plusDays(30).toInstant(ZoneOffset.UTC);
        }

        payload.setExpirationDate(dateExpiration);

        eventLogService.eventFromSystem("Facture prolongée", EventType.ACTION, EntityType.INVOICE_PLAN,
                payload.getId(), null);
        eventLogService.eventFromSystem("Facture prolongée " + payload.getBillingNumber(),
                EventType.ACTION, EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_EXTEND_EXPIRY_DATE;
    }

    @Override
    public List<RequiredField> getRequiredFields() {
        return List.of(new RequiredField("date_expiration", FieldType.DATE, "action.field.date_expiration"));
    }
}
