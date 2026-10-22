import {removeAccents} from '../../utils/string.util';
import {
    EntityGroup,
    FilterChipGroup,
    GROUP_ALPHA_KEY,
    HighlightedText,
    SORT_ALPHA_KEY,
    SORT_TITLE_KEY,
    SortOption
} from './entity-list.model';

/** Texte comparable : sans accent, en minuscules, sans espaces superflus. */
export function normalizeText(value: string | null | undefined): string {
    return removeAccents(value ?? '').toLocaleLowerCase().trim();
}

/** Vrai si l'un des champs contient la recherche, accents et casse ignorés. */
export function matchesSearch(fields: (string | null | undefined)[], query: string): boolean {
    const needle = normalizeText(query);
    if (!needle) {
        return true;
    }

    return fields.some(field => normalizeText(field).includes(needle));
}

/** Découpe un texte autour de la première occurrence de la recherche. */
export function highlight(text: string | null | undefined, query: string): HighlightedText {
    const value = text ?? '';
    const needle = normalizeText(query);

    if (!needle) {
        return {before: value, match: '', after: ''};
    }

    const index = normalizeText(value).indexOf(needle);
    if (index < 0) {
        return {before: value, match: '', after: ''};
    }

    return {
        before: value.slice(0, index),
        match: value.slice(index, index + needle.length),
        after: value.slice(index + needle.length)
    };
}

/** Initiale de groupement : lettre sans accent en majuscule, « # » sinon. */
export function groupInitial(value: string | null | undefined): string {
    const first = normalizeText(value).replace(/[^a-z]/g, '')[0];

    return first ? first.toLocaleUpperCase() : '#';
}

/** Comparateur alphabétique, accents ignorés. */
export function compareAlpha(a: string | null | undefined, b: string | null | undefined): number {
    return normalizeText(a).localeCompare(normalizeText(b));
}

/** Comparateur de date décroissante ; les dates absentes passent en dernier. */
export function compareDateDesc(a: Date | string | null | undefined,
                                b: Date | string | null | undefined): number {
    const timeA = toTime(a);
    const timeB = toTime(b);

    if (timeA === timeB) {
        return 0;
    }
    if (timeA === null) {
        return 1;
    }
    if (timeB === null) {
        return -1;
    }

    return timeB - timeA;
}

function toTime(value: Date | string | null | undefined): number | null {
    if (!value) {
        return null;
    }

    const time = value instanceof Date ? value.getTime() : new Date(value).getTime();

    return isNaN(time) ? null : time;
}

/**
 * Options de tri réellement proposées : quand on groupe par alphabet, le tri sur
 * la même clé devient redondant et disparaît.
 */
export function availableSorts(groupBy: string, sorts: SortOption[], alphaIsTitle = false): SortOption[] {
    if (groupBy !== GROUP_ALPHA_KEY) {
        return sorts;
    }

    return sorts.filter(sort => sort.key !== SORT_ALPHA_KEY && !(alphaIsTitle && sort.key === SORT_TITLE_KEY));
}

/** Applique les puces actives : OU dans un groupe « or », ET dans un groupe « and ». */
export function applyChipFilters<T>(items: T[],
                                    groups: FilterChipGroup[],
                                    activeChips: ReadonlySet<string>,
                                    predicates: Record<string, (item: T) => boolean>): T[] {
    if (activeChips.size === 0) {
        return items;
    }

    return groups.reduce((filtered, group) => {
        const active = group.chips.filter(chip => activeChips.has(chip.key));
        if (active.length === 0) {
            return filtered;
        }

        return filtered.filter(item => group.mode === 'and'
                                       ? active.every(chip => predicates[chip.key]?.(item) ?? true)
                                       : active.some(chip => predicates[chip.key]?.(item) ?? false));
    }, items);
}

/** Regroupe par initiale, groupes triés de A à Z (« # » en dernier). */
export function groupByAlphabet<T>(items: T[], keyFn: (item: T) => string | null | undefined): EntityGroup<T>[] {
    const buckets = new Map<string, T[]>();

    items.forEach(item => {
        const initial = groupInitial(keyFn(item));
        const bucket = buckets.get(initial);
        if (bucket) {
            bucket.push(item);
        } else {
            buckets.set(initial, [item]);
        }
    });

    const total = items.length || 1;

    return [...buckets.entries()]
        .sort(([a], [b]) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b))
        .map(([initial, bucketItems]) => ({
            key: initial,
            label: initial,
            rawLabel: true,
            color: 'var(--app-primary)',
            items: bucketItems,
            ratio: bucketItems.length / total
        }));
}

/** Regroupe selon un ordre imposé ; les groupes vides sont omis. */export function groupByKey<T>(items: T[],
                              order: string[],
                              keyFn: (item: T) => string | null | undefined,
                              labelFn: (key: string) => string,
                              colorFn: (key: string) => string): EntityGroup<T>[] {
    const buckets = new Map<string, T[]>();

    items.forEach(item => {
        const key = keyFn(item) ?? order[order.length - 1];
        const bucket = buckets.get(key);
        if (bucket) {
            bucket.push(item);
        } else {
            buckets.set(key, [item]);
        }
    });

    const total = items.length || 1;
    const keys = order.filter(key => buckets.has(key));
    buckets.forEach((_, key) => {
        if (!keys.includes(key)) {
            keys.push(key);
        }
    });

    return keys.map(key => ({
        key,
        label: labelFn(key),
        color: colorFn(key),
        items: buckets.get(key)!,
        ratio: buckets.get(key)!.length / total
    }));
}
