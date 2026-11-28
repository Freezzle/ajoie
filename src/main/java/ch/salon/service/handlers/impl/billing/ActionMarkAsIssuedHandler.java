package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionMarkAsIssuedHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload == null || (!payload.getState().isDraft() && payload.getState() != State.IS_ISSUING)) {
            return ActionSupport.rejected();
        }

        boolean hasLines = payload.getInvoices() != null && !payload.getInvoices().isEmpty();
        boolean hasPositiveTotal = payload.getInvoicesTotal() > 0.0d;

        return ActionSupport.fromConditions("action.invoice-marked-as-issued.help",
                ConditionalKey.of(hasLines, "action.invoice-marked-as-issued.condition.has-lines"),
                ConditionalKey.of(hasPositiveTotal, "action.invoice-marked-as-issued.condition.has-positive-total"));
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        payload.setIssuedDate(Instant.now());
        payload.setExpirationDate(InvoicingPlan.calculateExpirationDate(payload));
        payload.setState(State.ISSUED);

        eventLogService.eventFromSystem("Facture transmise", EventType.ACTION, EntityType.INVOICE_PLAN,
                payload.getId(), null);
        eventLogService.eventFromSystem("Facture transmise " + payload.getBillingNumber(),
                EventType.ACTION, EntityType.PARTICIPATION, payload.getParticipation().getId(), null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_MARK_AS_ISSUED;
    }
}
