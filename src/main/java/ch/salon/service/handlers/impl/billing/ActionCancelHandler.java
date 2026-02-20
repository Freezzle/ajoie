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

import java.util.Map;

@Component("cancelInvoicingPlan")
@RequiredArgsConstructor
public class ActionCancelHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null && (payload.getState() == State.ISSUED || payload.getState() == State.PAID) ?
                SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        payload.setState(State.CANCELLED);

        eventLogService.eventFromSystem("Facture annulée", EventType.ACTION, EntityType.INVOICE_PLAN, payload.getId(),
                null);
        eventLogService.eventFromSystem("Facture annulée " + payload.getBillingNumber(), EventType.ACTION,
                EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_MARK_AS_CANCELLED;
    }

    @Override
    public String getConfirmationKey() {
        return "action.invoice-marked-as-cancelled.confirm";
    }
}
