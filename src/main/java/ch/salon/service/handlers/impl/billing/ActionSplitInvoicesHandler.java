package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.ActionSupport;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.ConditionalKey;
import ch.salon.service.handlers.RequiredField;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.FieldType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ActionSplitInvoicesHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {
    private final InvoicingPlanService invoicingPlanService;

    @Override
    public ActionSupport supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload == null || !payload.getState().isDraft()) {
            return ActionSupport.rejected();
        }

        boolean hasEnoughInvoices = payload.getInvoices() != null && payload.getInvoices().size() >= 2;

        if (!hasEnoughInvoices) {
            return ActionSupport.disabled("action.invoice-split.help",
                ConditionalKey.nok("action.invoice-split.condition.enough-invoices"));
        }

        return ActionSupport.allowed("action.invoice-split.help",
            ConditionalKey.ok("action.invoice-split.condition.enough-invoices"));
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        Object invoicesObj = context.get("invoices");
        List<String> selectedInvoiceIds;
        if (invoicesObj instanceof List<?>) {
            selectedInvoiceIds = ((List<?>) invoicesObj).stream()
                    .map(Object::toString)
                    .toList();
        } else {
            selectedInvoiceIds = List.of();
        }
        List<UUID> invoiceUUIDs = selectedInvoiceIds.stream()
                .map(UUID::fromString)
                .toList();
        invoicingPlanService.splitInvoicingPlan(payload.getId(), invoiceUUIDs, false, false);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_SPLIT;
    }

    @Override
    public List<RequiredField> getRequiredFields(Object payload) {
        if (!(payload instanceof InvoicingPlan invoicingPlan)) {
            return List.of();
        }
        List<Map<String, String>> invoiceOptions = new ArrayList<>();
        if (invoicingPlan.getInvoices() != null) {
            for (Invoice invoice : invoicingPlan.getInvoices()) {
                String label = invoice.getLabel() != null ? invoice.getLabel() : "-";

                if (invoice.getCustomAmount() != null) {
                    label += " (" + invoice.getCustomAmount() + " CHF)";
                } else if (invoice.getDefaultAmount() != null) {
                    label += " (" + invoice.getDefaultAmount() + " CHF)";
                }

                invoiceOptions.add(Map.of("id", invoice.getId().toString(), "label", label));
            }
        }
        return List.of(
                new RequiredField("invoices", FieldType.PICKLIST, "action.field.invoices", invoiceOptions)
        );
    }
}