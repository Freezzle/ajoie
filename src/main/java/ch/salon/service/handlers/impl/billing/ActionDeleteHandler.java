package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.enums.ContextActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component("deleteInvoicingPlan")
@RequiredArgsConstructor
public class ActionDeleteHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final InvoicingPlanRepository repository;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState().isDraft()) {
            return ActionSupport.allowed("action.invoice-delete.help",
                ConditionalKey.ok("action.invoice-delete.condition.is-draft"));
        }
        return ActionSupport.rejected();
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        this.repository.delete(payload);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_DELETE;
    }

    @Override
    public String getConfirmationKey() {
        return "action.invoice-delete.confirm";
    }
}
