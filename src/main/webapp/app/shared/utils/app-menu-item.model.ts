import {MenuItem} from 'primeng/api';
import {ConditionalKey} from '../model/conditional-key';

/**
 * Extension du MenuItem de PrimeNG avec une propriété helpText et conditionalKeys
 * pour afficher une icône d'aide avec tooltip/popover
 */
export interface AppMenuItem extends MenuItem {
    /**
     * Texte d'aide à afficher dans un tooltip (desktop) ou popover (mobile)
     * Si présent, une icône "?" sera affichée à droite de l'item
     */
    helpText?: string;

    /**
     * Liste des conditions pour exécuter l'action
     * Chaque condition a un état (OK/NOK) et une clé de traduction
     */
    conditionalKeys?: ConditionalKey[];
}
