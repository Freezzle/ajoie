package ch.salon.service.handlers.impl.billing;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Payment;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.Mode;
import ch.salon.domain.enumeration.State;
import ch.salon.service.EventLogService;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Component("payAllCashInvoicingPlan")
@RequiredArgsConstructor
public class ActionPayAllCashHandler implements BusinessActionHandler<InvoicingPlan>, ActionMetadataProvider {

    private final EventLogService eventLogService;
    private final ActionCloseHandler actionCloseHandler;

    @Override
    public SupportType supports(InvoicingPlan payload, Map<String, Object> context) {
        if (payload != null && payload.getState() == State.ISSUED) {
            // Vérifier qu'il reste un solde à payer
            BigDecimal remaining = BigDecimal.valueOf(payload.getTotal());
            if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                return SupportType.ALLOWED;
            }
        }
        return SupportType.REJECTED;
    }

    @Override
    public void execute(InvoicingPlan payload, Map<String, Object> context) {
        // Calculer le solde restant
        BigDecimal remainingAmount = BigDecimal.valueOf(payload.getTotal());

        // Créer un nouveau paiement en CASH pour le solde restant
        Payment cashPayment = new Payment();
        cashPayment.setAmount(remainingAmount.doubleValue());
        cashPayment.setPaymentMode(Mode.CASH);
        cashPayment.setBillingDate(Instant.now());
        cashPayment.setExtraInformation("Paiement reçu");

        // Ajouter le paiement à la facture
        payload.getPayments().add(cashPayment);

        // Logger l'événement
        eventLogService.eventFromSystem("Paiement total effectué en cash", EventType.ACTION, EntityType.INVOICE_PLAN,
                payload.getId(), Map.of("amount", remainingAmount.toString(), "mode", "CASH"));

        // Clôturer la facture en déclenchant l'ActionCloseHandler
        actionCloseHandler.execute(payload, context);
    }

    @Override
    public ContextActionType getActionType() {
        return ContextActionType.INVOICE_PAY_ALL_CASH;
    }

    @Override
    public boolean needsConfirmation() {
        return true;
    }
}
