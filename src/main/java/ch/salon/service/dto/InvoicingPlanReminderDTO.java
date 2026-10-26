package ch.salon.service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Rappel de paiement envoyé pour une facture.
 * <p>
 * {@code dueDateAtSend} fige l'échéance du plan au moment de l'envoi : l'échéance courante est
 * repoussée après une relance, et la frise a besoin de l'ancienne pour expliquer le rappel.
 * Nulle pour les rappels enregistrés avant l'introduction du cliché.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoicingPlanReminderDTO implements Serializable {

    private Instant sentDate;
    private Instant dueDateAtSend;
}
