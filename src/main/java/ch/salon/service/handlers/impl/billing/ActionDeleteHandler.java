package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component("deleteInvoicingPlan")
@RequiredArgsConstructor
public class ActionDeleteHandler implements BusinessActionHandler<InvoicingPlan> {

    private final InvoicingPlanRepository repository;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null && payload.getState().isDraft() ? SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        this.repository.delete(payload);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_DELETE;
    }
}
