package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class MarkInvoiceAsIssuedHandler implements BusinessActionHandler<InvoicingPlan> {

    private final EventLogService eventLogService;

    public MarkInvoiceAsIssuedHandler(EventLogService eventLogService) {
        this.eventLogService = eventLogService;
    }

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        return payload != null && payload.getState().isDraft() ? SupportType.ALLOWED : SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        payload.setIssuedDate(Instant.now());
        payload.setExpirationDate(InvoicingPlan.calculateExpirationDate(payload));
        payload.setState(State.ISSUED);

        eventLogService.eventFromSystem("Facture marquée comme facturée", EventType.ACTION, EntityType.INVOICE_PLAN,
                                        payload.getId(), null);
        eventLogService.eventFromSystem("Facture marquée comme facturée " + payload.getBillingNumber(),
                                        EventType.ACTION, EntityType.PARTICIPATION, payload.getParticipation().getId(),
                                        null);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_MARK_AS_ISSUED;
    }
}
