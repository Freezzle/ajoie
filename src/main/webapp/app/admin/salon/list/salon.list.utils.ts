import {ISalon} from '../model/salon.interface';

/** État calculé d'un salon, affiché comme un statut dans la liste. */
export enum SalonState {
    NOW = 'NOW',
    NEXT = 'NEXT',
    PAST = 'PAST',
    ARCHIVED = 'ARCHIVED'
}

/** Ordre d'affichage des groupes de la liste des salons. */
export const SALON_STATE_ORDER: string[] = [
    SalonState.NOW,
    SalonState.NEXT,
    SalonState.PAST,
    SalonState.ARCHIVED
];

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Archivé, puis terminé, puis en cours, sinon à venir. */
export function salonState(salon: ISalon, today: Date = new Date()): SalonState {
    if (salon.archived) {
        return SalonState.ARCHIVED;
    }

    const reference = startOfDay(today);

    if (salon.endingDate && startOfDay(new Date(salon.endingDate)) < reference) {
        return SalonState.PAST;
    }

    if (salon.startingDate && startOfDay(new Date(salon.startingDate)) <= reference) {
        return SalonState.NOW;
    }

    return SalonState.NEXT;
}

export function salonStateColor(state: SalonState | string): string {
    switch (state as SalonState) {
        case SalonState.NOW:
            return 'var(--app-status-validated)';
        case SalonState.NEXT:
            return 'var(--app-status-accepted)';
        case SalonState.PAST:
            return 'var(--app-status-closed)';
        default:
            return 'var(--app-status-canceled)';
    }
}

/**
 * « J-x » quand l'ouverture est dans 60 jours ou moins, vide sinon.
 */
export function daysBeforeOpening(salon: ISalon, today: Date = new Date()): string {
    if (!salon.startingDate) {
        return '';
    }

    const days = Math.ceil((startOfDay(new Date(salon.startingDate)).getTime() - startOfDay(today).getTime())
                           / 86400000);

    return days > 0 && days <= 60 ? `· J-${days}` : '';
}

/**
 * Période du salon : « 13–15 nov. 2026 », ou « 30 oct. – 2 nov. 2026 » si les mois diffèrent.
 */
export function salonPeriod(salon: ISalon): string {
    if (!salon.startingDate || !salon.endingDate) {
        return '';
    }

    const start = new Date(salon.startingDate);
    const end = new Date(salon.endingDate);

    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
    }

    return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);

    return copy;
}
