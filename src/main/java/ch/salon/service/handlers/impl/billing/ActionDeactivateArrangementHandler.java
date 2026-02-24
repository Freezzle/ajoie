package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
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
public class ActionDeactivateArrangementHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final InvoicingPlanService invoicingPlanService;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState().isDraft() && payload.getNeedArrangement()) {
            return ActionSupport.allowed("action.invoice-deactivate-arrangement.help",
                ConditionalKey.ok("action.invoice-deactivate-arrangement.condition.has-arrangement"));
        }
        return ActionSupport.rejected();
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        invoicingPlanService.switchArrangement(payload.getId());
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_DEACTIVATE_ARRANGEMENT;
    }
}
