import {MenuItem} from 'primeng/api';

/**
 * Extension du MenuItem de PrimeNG avec une propriété helpText
 * pour afficher une icône d'aide avec tooltip/popover
 */
export interface AppMenuItem extends MenuItem {
    /**
     * Texte d'aide à afficher dans un tooltip (desktop) ou popover (mobile)
     * Si présent, une icône "?" sera affichée à droite de l'item
     */
    helpText?: string;
}
