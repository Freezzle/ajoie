import {Status} from '../../../admin/enumerations/status.model';
import {ConditionalKey} from '../../model/conditional-key';

/** Option de groupement proposée dans le menu « Grouper et trier ». */
export interface GroupOption {
    key: string;
    labelKey: string;
}

/** Option de tri proposée dans le menu « Grouper et trier ». */
export interface SortOption {
    key: string;
    labelKey: string;
    hintKey?: string;
}

/** Puce de filtre de la barre d'outils. */
export interface FilterChip {
    key: string;
    labelKey: string;
    /** Icône FontAwesome (sans préfixe), pour les signaux. */
    icon?: string;
    /** Couleur CSS (variable du thème) du point, pour les statuts et les périodes. */
    dotColor?: string;
    /** Couleur CSS (variable du thème) de l'icône, pour les signaux. */
    color?: string;
    count: number;
    /** Une puce de signal sans effectif est masquée ; les statuts restent affichés. */
    alwaysVisible?: boolean;
}

/** Groupe de puces : les statuts se combinent en OU, les signaux en ET. */
export interface FilterChipGroup {
    key: string;
    labelKey: string;
    mode: 'or' | 'and';
    chips: FilterChip[];
}

/** Groupe de lignes affiché dans la liste. */
export interface EntityGroup<T> {
    key: string;
    /** Clé de traduction du libellé, ou libellé brut si `rawLabel` est vrai. */
    label: string;
    rawLabel?: boolean;
    color: string;
    items: T[];
    /** Part du groupe dans le total, de 0 à 1. */
    ratio: number;
    /** Résumé affiché à droite de l'en-tête, déjà formaté. */
    summary?: string;
}

/** Les trois morceaux d'un texte surligné par la recherche. */
export interface HighlightedText {
    before: string;
    match: string;
    after: string;
}

/** Action proposée par le rouage d'une ligne. */
export interface EntityAction {
    labelKey: string;
    /** Classe PrimeIcons, par exemple `pi pi-eye`. */
    icon?: string;
    routerLink?: unknown[];
    /** Action impérative ; reçoit le rouage pour ancrer une confirmation. */
    run?: (target: HTMLElement) => void;
    /** Affichée en rouge (la suppression). */
    danger?: boolean;
    separatorBefore?: boolean;
    hidden?: boolean;
    /** Affichée mais non cliquable (par exemple pendant le chargement des actions serveur). */
    disabled?: boolean;
    /** Texte d'aide déjà traduit ; affiche une icône « ? » ouvrant un popover. */
    helpText?: string;
    /** Conditions d'exécution (OK/NOK) listées dans le popover d'aide. */
    conditionalKeys?: ConditionalKey[];
}

export const SORT_DATE_KEY = 'date';
export const SORT_ALPHA_KEY = 'alpha';
export const SORT_TITLE_KEY = 'title';
export const GROUP_ALPHA_KEY = 'alpha';
export const GROUP_STATUS_KEY = 'status';
export const GROUP_CATEGORY_KEY = 'category';

/** Ordre d'affichage des groupes par statut. */
export const STATUS_GROUP_ORDER: Status[] = [
    Status.IN_VERIFICATION,
    Status.ACCEPTED,
    Status.VALIDATED,
    Status.CLOSED,
    Status.REFUSED,
    Status.CANCELED
];

/** Statuts repliés par défaut quand on groupe par statut. */
export const STATUS_COLLAPSED_BY_DEFAULT: string[] = [Status.REFUSED, Status.CANCELED];

/** Statuts considérés comme « écartés ». */
export const DISCARDED_STATUSES: Status[] = [Status.REFUSED, Status.CANCELED];

/** Couleur de thème associée à un statut. */
export function statusColor(status: Status | string | null | undefined): string {
    switch (status) {
        case Status.IN_VERIFICATION:
            return 'var(--app-status-verification)';
        case Status.ACCEPTED:
            return 'var(--app-status-accepted)';
        case Status.VALIDATED:
            return 'var(--app-status-validated)';
        case Status.CLOSED:
            return 'var(--app-status-closed)';
        case Status.REFUSED:
            return 'var(--app-status-refused)';
        case Status.CANCELED:
            return 'var(--app-status-canceled)';
        default:
            return 'var(--app-text-muted)';
    }
}

/** Couleur de thème associée à une catégorie de stand. */
export function categoryColor(category: string | null | undefined): string {
    return category ? `var(--app-category-${category.toLowerCase()})` : 'var(--app-category-none)';
}
