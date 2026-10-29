/**
 * Fonctions pures de la frise à peindre (disponibilités bénévoles). Aucune dépendance Angular,
 * pour être testables unitairement (voir .spec.ts).
 */

export const FRISE_STEP_MINUTES = 60;

export interface FriseSlot {
    index: number;
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
    label: string; // "13h"
}

export interface ITimeRange {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

export type PresetKey = 'all' | 'morning' | 'afternoon';

export interface Preset {
    key: PresetKey;
    from: number; // index inclus
    to: number;   // index inclus
}

const NOON_MINUTES = 12 * 60;

export function toMinutes(hhmm: string): number {
    if (!hhmm || !hhmm.includes(':')) {
        return 0;
    }
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

export function toHhmm(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/**
 * Découpe la plage [startTime, endTime] en cases de `stepMinutes`. Si la durée n'est pas un
 * multiple du pas, la dernière case est plus courte (elle finit à endTime).
 */
export function buildFriseSlots(startTime: string, endTime: string, stepMinutes = FRISE_STEP_MINUTES): FriseSlot[] {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    const slots: FriseSlot[] = [];
    let cur = start;
    let index = 0;
    while (cur < end) {
        const slotEnd = Math.min(cur + stepMinutes, end);
        slots.push({index, start: toHhmm(cur), end: toHhmm(slotEnd), label: formatLabel(cur)});
        cur = slotEnd;
        index++;
    }
    return slots;
}

/** Suites consécutives d'indexes choisis : [début, fin[ en indexes, triés, sans doublons. */
export function toRuns(indexes: number[]): Array<[number, number]> {
    const sorted = [...new Set(indexes)].sort((a, b) => a - b);
    const runs: Array<[number, number]> = [];
    for (const i of sorted) {
        const last = runs[runs.length - 1];
        if (last && i === last[1]) {
            last[1] = i + 1;
        } else {
            runs.push([i, i + 1]);
        }
    }
    return runs;
}

/** Convertit les indexes choisis en plages horaires. */
export function runsToRanges(slots: FriseSlot[], indexes: number[]): ITimeRange[] {
    return toRuns(indexes)
        .filter(([a, b]) => slots[a] && slots[b - 1])
        .map(([a, b]) => ({start: slots[a].start, end: slots[b - 1].end}));
}

/** Convertit des plages horaires en indexes : une case est incluse si entièrement couverte. */
export function rangesToIndexes(slots: FriseSlot[], ranges: ITimeRange[]): number[] {
    const bounds = ranges.map(r => [toMinutes(r.start), toMinutes(r.end)] as const);
    const indexes: number[] = [];
    for (const slot of slots) {
        const s = toMinutes(slot.start);
        const e = toMinutes(slot.end);
        if (bounds.some(([bs, be]) => bs <= s && be >= e)) {
            indexes.push(slot.index);
        }
    }
    return indexes;
}

/** Ajoute toutes les cases [from..to], ou les retire toutes si elles sont déjà toutes choisies. */
export function toggleRange(indexes: number[], from: number, to: number): number[] {
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const set = new Set(indexes);
    let allSelected = true;
    for (let i = lo; i <= hi; i++) {
        if (!set.has(i)) {
            allSelected = false;
            break;
        }
    }
    for (let i = lo; i <= hi; i++) {
        if (allSelected) {
            set.delete(i);
        } else {
            set.add(i);
        }
    }
    return [...set].sort((a, b) => a - b);
}

/** Total d'heures des cases choisies, en tenant compte d'une dernière case plus courte. */
export function totalHours(slots: FriseSlot[], indexes: number[]): number {
    const set = new Set(indexes);
    let minutes = 0;
    for (const slot of slots) {
        if (set.has(slot.index)) {
            minutes += toMinutes(slot.end) - toMinutes(slot.start);
        }
    }
    return minutes / 60;
}

/**
 * Raccourcis applicables. 'all' toujours présent. 'morning'/'afternoon' omis s'ils sont vides
 * ou identiques à « Toute la journée ».
 */
export function presetsFor(slots: FriseSlot[]): Preset[] {
    if (slots.length === 0) {
        return [];
    }
    const presets: Preset[] = [{key: 'all', from: 0, to: slots.length - 1}];

    const morning = slots.filter(s => toMinutes(s.start) < NOON_MINUTES);
    const afternoon = slots.filter(s => toMinutes(s.start) >= NOON_MINUTES);

    if (morning.length > 0 && morning.length < slots.length) {
        presets.push({key: 'morning', from: morning[0].index, to: morning[morning.length - 1].index});
    }
    if (afternoon.length > 0 && afternoon.length < slots.length) {
        presets.push({key: 'afternoon', from: afternoon[0].index, to: afternoon[afternoon.length - 1].index});
    }
    return presets;
}
