import {formatDate} from '@angular/common';

/** Tiret demi-cadratin entouré d'espaces insécables : la plage ne doit jamais être coupée en deux lignes. */
const RANGE_SEPARATOR = '\u00a0\u2013\u00a0';

/**
 * Formate la plage de dates d'un salon en français, en factorisant ce qui est commun aux deux dates :
 * - même mois et même année : `13 – 14 mars 2027`
 * - même année, mois différents : `28 février – 1 mars 2027`
 * - années différentes : `31 décembre 2026 – 1 janvier 2027`
 * - une seule date (ou dates identiques) : `13 mars 2027`
 */
export function formatSalonDateRange(startingDate: string | Date | null | undefined,
                                     endingDate: string | Date | null | undefined,
                                     locale: string): string | null {
    const start = toDate(startingDate);
    const end = toDate(endingDate);

    if (!start && !end) {
        return null;
    }
    if (!start || !end) {
        return formatDate((start ?? end)!, 'd MMMM y', locale);
    }

    if (isSameDay(start, end)) {
        return formatDate(start, 'd MMMM y', locale);
    }
    if (start.getFullYear() !== end.getFullYear()) {
        return formatDate(start, 'd MMMM y', locale) + RANGE_SEPARATOR + formatDate(end, 'd MMMM y', locale);
    }
    if (start.getMonth() !== end.getMonth()) {
        return formatDate(start, 'd MMMM', locale) + RANGE_SEPARATOR + formatDate(end, 'd MMMM y', locale);
    }
    return formatDate(start, 'd', locale) + RANGE_SEPARATOR + formatDate(end, 'd MMMM y', locale);
}

function toDate(value: string | Date | null | undefined): Date | null {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
