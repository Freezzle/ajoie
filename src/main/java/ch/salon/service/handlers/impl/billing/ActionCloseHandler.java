package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component("closeInvoicingPlan")
@RequiredArgsConstructor
public class ActionCloseHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState() == State.ISSUED) {
            if (BigDecimal.valueOf(payload.getTotal()).compareTo(BigDecimal.ZERO) == 0) {
                return SupportType.ALLOWED;
            } else {
                return SupportType.DISABLED;
            }
        }

        return SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        payload.setState(State.PAID);

        eventLogService.eventFromSystem("Facture payée", EventType.ACTION, EntityType.INVOICE_PLAN, payload.getId(),
                null);
        eventLogService.eventFromSystem("Facture payée " + payload.getBillingNumber(), EventType.ACTION,
                EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_MARK_AS_PAID;
    }

    @Override
    public String getConfirmationKey() {
        return "action.invoice-marked-as-paid.confirm";
    }
}
