export enum ModePaymentMeals {
    MIXED = 'MIXED',
    SEPARATE = 'SEPARATE',
}

export function formatterModePaymentMeals(mode: ModePaymentMeals | null): string {
    return 'participation.modePaymentMeals.list.' + mode;
}

export function compareModePaymentMeals(o1: ModePaymentMeals, o2: ModePaymentMeals): boolean {
    return o1 === o2;
}
