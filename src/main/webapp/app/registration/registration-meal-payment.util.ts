import {ModePaymentMeals} from '../admin/enumerations/mode-payment-meals.model';

/**
 * Clé de traduction du mode de paiement des repas pour le formulaire public.
 * Les libellés de l'administration restent inchangés : l'inscription utilise des textes
 * plus explicites pour les exposants.
 */
export function registrationModePaymentMealsKey(mode: ModePaymentMeals | null): string {
    return 'registration.participation.modePaymentMeals.list.' + mode;
}
