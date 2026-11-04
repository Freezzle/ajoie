package ch.salon.billing.support;

import ch.salon.billing.application.IssueRequest;
import ch.salon.billing.domain.ChargeKind;
import ch.salon.billing.domain.ChargeSpec;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Ce que serait {@code ParticipationBillingPolicy} dans l'application : TOUTES les règles métier du
 * salon (prix, repas séparés, frais postaux, arrangement, réduction) sont ici, PAS dans la
 * facturation. La facturation ne reçoit que des {@link ChargeSpec} génériques.
 */
public class FakeParticipationBillingPolicy {

    public static final String MAIN = "main";
    public static final String MEALS = "meals";

    private static final Map<String, String> STAND_PRICES = Map.of(
            "2x2", "300.00",
            "3x3", "450.00",
            "3x4", "550.00");

    public List<ChargeSpec> desiredCharges(FakeParticipation p) {
        List<ChargeSpec> charges = new ArrayList<>();
        if (p.cancelled) {
            // Règle salon : annulée → plus rien n'est dû, sauf d'éventuels frais d'annulation.
            if (p.cancellationFee != null) {
                charges.add(ChargeSpec.charge("cancellation-fee", "Frais d'annulation").price(p.cancellationFee)
                                      .kind(ChargeKind.FEE).category("fee").build());
            }
            return charges;
        }
        if (!p.isBillable()) {
            return charges; // en vérification / refusée : rien n'est facturable
        }
        for (FakeParticipation.FakeStand stand : p.stands) {
            if (!stand.isBillable()) {
                continue; // seuls les sous-objets acceptés ou validés sont facturés
            }
            charges.add(ChargeSpec.charge("stand:" + stand.id, "Stand " + stand.dimension + " m")
                                  .price(STAND_PRICES.get(stand.dimension)).category("stand")
                                  .attribute("dimension", stand.dimension).build());
            if (stand.electricity) {
                charges.add(ChargeSpec.charge("electricity:" + stand.id, "Électricité 230 V")
                                      .price("35.00").category("electricity").build());
            }
            if (stand.tables > 0) {
                charges.add(ChargeSpec.charge("table:" + stand.id, "Table supplémentaire")
                                      .quantity(stand.tables).price("15.00").category("furniture").build());
            }
        }
        // Règle salon : les repas peuvent être facturés à part.
        String mealGroup = p.mealsSeparate ? MEALS : MAIN;
        if (p.mealsSaturday > 0) {
            charges.add(ChargeSpec.charge("meal:1", "Repas samedi").quantity(p.mealsSaturday).price("22.50")
                                  .group(mealGroup).category("meal").build());
        }
        if (p.mealsSunday > 0) {
            charges.add(ChargeSpec.charge("meal:2", "Repas dimanche").quantity(p.mealsSunday).price("22.50")
                                  .group(mealGroup).category("meal").build());
        }
        // Règle salon : envoi postal = frais de port.
        if (p.postal) {
            charges.add(ChargeSpec.charge("postal-fee", "Frais d'envoi postal").price("3.00")
                                  .kind(ChargeKind.FEE).category("fee").build());
        }
        // Règle salon : invité d'honneur = geste commercial.
        if (p.guestOfHonor && p.stands.stream().anyMatch(FakeParticipation.FakeStand::isBillable)) {
            charges.add(ChargeSpec.charge("discount:guest", "Réduction invité d'honneur").price("-100.00")
                                  .kind(ChargeKind.DISCOUNT).category("discount").build());
        }
        return charges;
    }

    /** Règle salon : acompte de 100.– par stand accepté. */
    public ch.salon.billing.domain.Money depositAmount(FakeParticipation p) {
        long stands = p.stands.stream().filter(FakeParticipation.FakeStand::isBillable).count();
        return ch.salon.billing.domain.Money.chf("100.00").times(java.math.BigDecimal.valueOf(Math.max(1, stands)));
    }

    /** Règle salon : avec un arrangement, l'échéance est la date du salon. */
    public IssueRequest issueRequest(FakeParticipation p, String group) {
        return new IssueRequest(group, p.arrangement ? p.salonDate : null);
    }
}
