package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ActionSwitchToPostalHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final InvoicingPlanService invoicingPlanService;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState().isDraft()
                && payload.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL) {
            return ActionSupport.allowed("action.invoice-switch-to-postal.help",
                ConditionalKey.ok("action.invoice-switch-to-postal.condition.is-email"));
        }
        return ActionSupport.rejected();
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        invoicingPlanService.switchInvoiceSendingMethod(payload.getId(), InvoiceSendingMethod.POSTAL);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_SWITCH_TO_POSTAL;
    }
}
