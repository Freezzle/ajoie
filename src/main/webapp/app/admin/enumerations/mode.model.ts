export enum Mode {
    BANK = 'BANK',
    CASH = 'CASH',
    SERVICE = 'SERVICE',
    OTHER = 'OTHER',
}

export const PAYMENT_MODES: Mode[] = [Mode.BANK, Mode.CASH, Mode.SERVICE, Mode.OTHER];

export function formatterPaymentMode(mode: Mode | null): string {
    return `payment.type.list.${mode}`;
}

/**
 * Libellé imprimé sur la facture, déduit du mode. Le mode « Autre » impose une saisie manuelle :
 * la clé renvoyée est alors nulle.
 */
export function autoPaymentLabelKey(mode: Mode | null | undefined): string | null {
    return mode && mode !== Mode.OTHER ? `invoicingPlan.payment.autoLabel.${mode}` : null;
}
