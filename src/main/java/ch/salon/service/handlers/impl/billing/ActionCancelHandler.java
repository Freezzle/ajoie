package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component("cancelInvoicingPlan")
@RequiredArgsConstructor
public class ActionCancelHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload == null || (payload.getState() != State.ISSUED && payload.getState() != State.PAID)) {
            return ActionSupport.rejected();
        }

        boolean hasNoPayment = payload.getPaymentsTotal() <= 0.0d;
        boolean participationNotClosed = payload.getParticipation() != null
                && payload.getParticipation().getStatus() != Status.CLOSED;

        return ActionSupport.fromConditions("action.invoice-marked-as-cancelled.help",
                ConditionalKey.of(hasNoPayment, "action.invoice-marked-as-cancelled.condition.no-payment"),
                ConditionalKey.of(participationNotClosed, "action.invoice-marked-as-cancelled.condition.participation-not-closed"));
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
