/**
 * Formatage des libellés de jour pour le parcours bénévole, à partir d'une date ISO yyyy-MM-dd.
 * Si la date est absente, le libellé du planning est utilisé en repli.
 */

function parse(date: string | null): Date | null {
    if (!date) {
        return null;
    }
    const parts = date.split('-').map(Number);
    return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
}

function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Jeudi 12 novembre" (ou le libellé de repli). */
export function longDate(date: string | null, fallback: string, locale = 'fr-CH'): string {
    const d = parse(date);
    if (!d) {
        return fallback;
    }
    return cap(d.toLocaleDateString(locale, {weekday: 'long', day: 'numeric', month: 'long'}));
}

/** "JEU" (abréviation du jour, en majuscules) ou vide. */
export function dayAbbrev(date: string | null, locale = 'fr-CH'): string {
    const d = parse(date);
    if (!d) {
        return '';
    }
    return d.toLocaleDateString(locale, {weekday: 'short'}).replace('.', '').slice(0, 3).toUpperCase();
}

/** "12" (numéro du jour) ou vide. */
export function dayNumber(date: string | null): string {
    const d = parse(date);
    return d ? String(d.getDate()) : '';
}

/** "Jeu 12" (abréviation + numéro) ou le libellé de repli. */
export function shortLabel(date: string | null, fallback: string, locale = 'fr-CH'): string {
    const d = parse(date);
    if (!d) {
        return fallback;
    }
    const abbr = cap(d.toLocaleDateString(locale, {weekday: 'short'}).replace('.', ''));
    return `${abbr} ${d.getDate()}`;
}
