package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component("closeInvoicingPlan")
@RequiredArgsConstructor
public class ActionCloseHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload == null || payload.getState() != State.ISSUED) {
            return ActionSupport.rejected();
        }

        if (BigDecimal.valueOf(payload.getTotal()).compareTo(BigDecimal.ZERO) != 0) {
            return ActionSupport.disabled("action.invoice-marked-as-paid.disabled.balance-remaining");
        }

        return ActionSupport.allowed();
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
