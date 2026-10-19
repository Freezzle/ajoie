import {Category, computeTimeSlots, Day, DayCell, Tool, UnavailableCell} from './volunteer-planning-model';

export const cellKey = (volunteerId: string, slotIndex: number): string => `${volunteerId}::${slotIndex}`;

/** Largeur fixe d'un créneau, en px, quelle que soit la durée de l'intervalle. */
export const SLOT_WIDTH = 45;
export const NAME_COLUMN_WIDTH = 170;

/** Suites consécutives d'un bénévole : une affectation ou une indisponibilité = un bloc. */
export type Run = {
    volunteerId: string;
    kind: 'CATEGORY' | 'UNAVAILABLE';
    categoryId?: string;
    start: number;
    end: number; // exclusif
};

export type CoverageState = 'none' | 'under' | 'ok' | 'over';

export type RangeStatus = {
    here: number;
    free: number;
    unavailable: number;
    busy: Record<string, number>;
    length: number;
};

export function slotCount(day: Day): number {
    return computeTimeSlots(day.startTime, day.endTime, day.intervalMinutes).length;
}

// ---------- lectures ----------

function cellIndex(day: Day, volunteerId: string, slotIndex: number): number {
    return day.cells.findIndex(c => c.volunteerId === volunteerId && c.slotIndex === slotIndex);
}

function unavailableIndex(day: Day, volunteerId: string, slotIndex: number): number {
    return (day.unavailableCells ?? []).findIndex(c => c.volunteerId === volunteerId && c.slotIndex === slotIndex);
}

function needIndex(day: Day, categoryId: string, slotIndex: number): number {
    return (day.needs ?? []).findIndex(n => n.categoryId === categoryId && n.slotIndex === slotIndex);
}

export function getCellCategory(day: Day, volunteerId: string, slotIndex: number): string | null {
    const i = cellIndex(day, volunteerId, slotIndex);
    return i >= 0 ? day.cells[i].categoryId : null;
}

export function isUnavailable(day: Day, volunteerId: string, slotIndex: number): boolean {
    return unavailableIndex(day, volunteerId, slotIndex) >= 0;
}

/** Index rapide : clé "vId::slot" -> categoryId. */
export function buildCellMap(day: Day): Map<string, string> {
    const m = new Map<string, string>();
    for (const c of day.cells) {
        m.set(cellKey(c.volunteerId, c.slotIndex), c.categoryId);
    }
    return m;
}

/** Index rapide : set des clés "vId::slot" indisponibles. */
export function buildUnavailableSet(day: Day): Set<string> {
    const s = new Set<string>();
    for (const c of (day.unavailableCells ?? [])) {
        s.add(cellKey(c.volunteerId, c.slotIndex));
    }
    return s;
}

export function computeRuns(day: Day, volunteerId: string, count: number): Run[] {
    const cells = buildCellMap(day);
    const unav = buildUnavailableSet(day);
    const out: Run[] = [];
    let current: Run | null = null;

    for (let i = 0; i <= count; i++) {
        let kind: 'CATEGORY' | 'UNAVAILABLE' | null = null;
        let categoryId: string | undefined;

        if (i < count) {
            const key = cellKey(volunteerId, i);
            if (unav.has(key)) {
                kind = 'UNAVAILABLE';
            } else {
                const cat = cells.get(key);
                if (cat) {
                    kind = 'CATEGORY';
                    categoryId = cat;
                }
            }
        }

        const sameAsCurrent = current !== null && current.kind === kind && current.categoryId === categoryId;
        if (current && !sameAsCurrent) {
            current.end = i;
            out.push(current);
            current = null;
        }
        if (!current && kind) {
            current = {volunteerId, kind, categoryId, start: i, end: i + 1};
        }
    }
    return out;
}

export function countAssigned(day: Day, categoryId: string, slot: number): number {
    const assigned = new Set(day.assignedVolunteerIds ?? []);
    let n = 0;
    for (const c of day.cells) {
        if (c.categoryId === categoryId && c.slotIndex === slot && assigned.has(c.volunteerId)) {
            n++;
        }
    }
    return n;
}

export function getNeed(day: Day, categoryId: string, slot: number): number {
    const i = needIndex(day, categoryId, slot);
    return i >= 0 ? (day.needs[i].min ?? 0) : 0;
}

export function coverage(assigned: number, min: number): CoverageState {
    if (assigned === 0 && min === 0) {
        return 'none';
    }
    if (assigned < min) {
        return 'under';
    }
    return assigned === min ? 'ok' : 'over';
}

export function freeVolunteers(day: Day, slot: number): string[] {
    const cells = buildCellMap(day);
    const unav = buildUnavailableSet(day);
    return (day.assignedVolunteerIds ?? []).filter(v => {
        const key = cellKey(v, slot);
        return !cells.has(key) && !unav.has(key);
    });
}

export function volunteerHours(day: Day, volunteerId: string): number {
    const unav = buildUnavailableSet(day);
    let n = 0;
    for (const c of day.cells) {
        if (c.volunteerId === volunteerId && !unav.has(cellKey(c.volunteerId, c.slotIndex))) {
            n++;
        }
    }
    return (n * day.intervalMinutes) / 60;
}

export function dayStats(day: Day, categories: Category[]): { coveragePct: number; missingPlaces: number; plannedHours: number } {
    const count = slotCount(day);
    const cells = buildCellMap(day);
    const unav = buildUnavailableSet(day);
    const assigned = day.assignedVolunteerIds ?? [];

    // counts[categoryId][slot]
    const counts = new Map<string, number[]>();
    for (const cat of categories) {
        counts.set(cat.id, new Array(count).fill(0));
    }
    for (const v of assigned) {
        for (let i = 0; i < count; i++) {
            const key = cellKey(v, i);
            if (unav.has(key)) {
                continue;
            }
            const catId = cells.get(key);
            const arr = catId ? counts.get(catId) : undefined;
            if (arr) {
                arr[i]++;
            }
        }
    }

    let totalMin = 0;
    let covered = 0;
    let missingPlaces = 0;
    for (const need of (day.needs ?? [])) {
        if (need.min <= 0 || need.slotIndex >= count) {
            continue;
        }
        const arr = counts.get(need.categoryId);
        if (!arr) {
            continue;
        }
        const a = arr[need.slotIndex];
        totalMin += need.min;
        covered += Math.min(a, need.min);
        if (a < need.min) {
            missingPlaces += need.min - a;
        }
    }

    let plannedSlots = 0;
    for (const arr of counts.values()) {
        for (const n of arr) {
            plannedSlots += n;
        }
    }

    return {
        coveragePct: totalMin ? Math.round((covered / totalMin) * 100) : 100,
        missingPlaces,
        plannedHours: (plannedSlots * day.intervalMinutes) / 60
    };
}

// ---------- mutations (immutables) ----------

export function setNeed(day: Day, categoryId: string, slot: number, min: number): Day {
    const i = needIndex(day, categoryId, slot);
    const value = Math.max(0, Math.trunc(min));

    if (value <= 0) {
        if (i < 0) {
            return day;
        }
        const needs = [...(day.needs ?? [])];
        needs.splice(i, 1);
        return {...day, needs};
    }

    if (i >= 0) {
        if (day.needs[i].min === value) {
            return day;
        }
        const needs = [...day.needs];
        needs[i] = {...needs[i], min: value};
        return {...day, needs};
    }

    return {...day, needs: [...(day.needs ?? []), {categoryId, slotIndex: slot, min: value}]};
}

/** Applique un outil sur une plage [start, end[ pour un bénévole (sémantique de applyTool). */
export function applyToolRange(day: Day, volunteerId: string, start: number, end: number, tool: Tool): Day {
    if (tool.kind === 'NONE' || end <= start) {
        return day;
    }

    const unav = buildUnavailableSet(day);
    let cells: DayCell[] | null = null;
    let unavailableCells: UnavailableCell[] | null = null;

    const cellPos = new Map<string, number>();
    day.cells.forEach((c, idx) => cellPos.set(cellKey(c.volunteerId, c.slotIndex), idx));

    const removedCellKeys = new Set<string>();
    const addedCells: DayCell[] = [];
    const removedUnavKeys = new Set<string>();
    const addedUnav: UnavailableCell[] = [];

    for (let slot = start; slot < end; slot++) {
        const key = cellKey(volunteerId, slot);

        if (tool.kind === 'UNAVAILABLE') {
            if (!unav.has(key)) {
                addedUnav.push({volunteerId, slotIndex: slot});
            }
            if (cellPos.has(key)) {
                removedCellKeys.add(key);
            }
            continue;
        }

        if (tool.kind === 'CLEAR_UNAVAILABLE') {
            if (unav.has(key)) {
                removedUnavKeys.add(key);
            }
            continue;
        }

        // ERASER et CATEGORY : ignorés sur une cellule indisponible
        if (unav.has(key)) {
            continue;
        }

        if (tool.kind === 'ERASER') {
            if (cellPos.has(key)) {
                removedCellKeys.add(key);
            }
        } else {
            const idx = cellPos.get(key);
            if (idx === undefined) {
                addedCells.push({volunteerId, slotIndex: slot, categoryId: tool.categoryId});
            } else if (day.cells[idx].categoryId !== tool.categoryId) {
                removedCellKeys.add(key);
                addedCells.push({volunteerId, slotIndex: slot, categoryId: tool.categoryId});
            }
        }
    }

    if (removedCellKeys.size || addedCells.length) {
        cells = day.cells.filter(c => !removedCellKeys.has(cellKey(c.volunteerId, c.slotIndex)));
        cells.push(...addedCells);
    }
    if (removedUnavKeys.size || addedUnav.length) {
        unavailableCells = (day.unavailableCells ?? []).filter(c => !removedUnavKeys.has(cellKey(c.volunteerId, c.slotIndex)));
        unavailableCells.push(...addedUnav);
    }

    if (!cells && !unavailableCells) {
        return day;
    }
    return {
        ...day,
        cells: cells ?? day.cells,
        unavailableCells: unavailableCells ?? (day.unavailableCells ?? [])
    };
}

/** Retire les cellules d'un run (catégorie ou indisponibilité) sur sa plage d'origine. */
export function deleteRun(day: Day, run: Run): Day {
    if (run.kind === 'UNAVAILABLE') {
        const unavailableCells = (day.unavailableCells ?? []).filter(
            c => !(c.volunteerId === run.volunteerId && c.slotIndex >= run.start && c.slotIndex < run.end)
        );
        return unavailableCells.length === (day.unavailableCells ?? []).length ? day : {...day, unavailableCells};
    }
    const cells = day.cells.filter(
        c => !(c.volunteerId === run.volunteerId && c.categoryId === run.categoryId && c.slotIndex >= run.start && c.slotIndex < run.end)
    );
    return cells.length === day.cells.length ? day : {...day, cells};
}

/** Déplace / redimensionne / réaffecte un bloc. Les cellules indisponibles de la cible sont ignorées. */
export function moveRun(day: Day, run: Run, targetVolunteerId: string, newStart: number, newEnd: number): Day {
    if (newEnd <= newStart) {
        return day;
    }
    const cleared = deleteRun(day, run);
    const tool: Tool = run.kind === 'UNAVAILABLE'
        ? {kind: 'UNAVAILABLE'}
        : {kind: 'CATEGORY', categoryId: run.categoryId!};
    const applied = applyToolRange(cleared, targetVolunteerId, newStart, newEnd, tool);

    // Aucun créneau n'a pu être écrit (cible entièrement indisponible) : on annule le déplacement
    // plutôt que de supprimer silencieusement le bloc d'origine.
    return applied === cleared ? day : applied;
}

export function changeRunCategory(day: Day, run: Run, categoryId: string): Day {
    if (run.kind === 'UNAVAILABLE') {
        return day;
    }
    const cleared = deleteRun(day, run);
    return applyToolRange(cleared, run.volunteerId, run.start, run.end, {kind: 'CATEGORY', categoryId});
}

// ---------- panneau d'affectation ----------

export function rangeStatus(day: Day, volunteerId: string, categoryId: string, start: number, endInclusive: number): RangeStatus {
    const cells = buildCellMap(day);
    const unav = buildUnavailableSet(day);
    const busy: Record<string, number> = {};
    let here = 0;
    let free = 0;
    let unavailable = 0;

    for (let i = start; i <= endInclusive; i++) {
        const key = cellKey(volunteerId, i);
        if (unav.has(key)) {
            unavailable++;
            continue;
        }
        const cat = cells.get(key);
        if (cat === categoryId) {
            here++;
        } else if (cat) {
            busy[cat] = (busy[cat] ?? 0) + 1;
        } else {
            free++;
        }
    }

    return {here, free, unavailable, busy, length: endInclusive - start + 1};
}

export function assignOnRange(
    day: Day,
    volunteerId: string,
    categoryId: string,
    start: number,
    endInclusive: number,
    mode: 'free-only' | 'force'
): Day {
    const cells = buildCellMap(day);
    const unav = buildUnavailableSet(day);

    const removedKeys = new Set<string>();
    const added: DayCell[] = [];

    for (let i = start; i <= endInclusive; i++) {
        const key = cellKey(volunteerId, i);
        if (unav.has(key)) {
            continue;
        }
        const cat = cells.get(key);
        if (cat === categoryId) {
            continue;
        }
        if (cat) {
            if (mode !== 'force') {
                continue;
            }
            removedKeys.add(key);
        }
        added.push({volunteerId, slotIndex: i, categoryId});
    }

    if (!removedKeys.size && !added.length) {
        return day;
    }
    const next = day.cells.filter(c => !removedKeys.has(cellKey(c.volunteerId, c.slotIndex)));
    next.push(...added);
    return {...day, cells: next};
}

export function unassignOnRange(day: Day, volunteerId: string, categoryId: string, start: number, endInclusive: number): Day {
    const cells = day.cells.filter(
        c => !(c.volunteerId === volunteerId && c.categoryId === categoryId && c.slotIndex >= start && c.slotIndex <= endInclusive)
    );
    return cells.length === day.cells.length ? day : {...day, cells};
}

// ---------- divers ----------

export function hueFromId(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) % 360;
    }
    return h;
}

export function initials(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (label.trim().slice(0, 2) || '?').replace(/^./, c => c.toUpperCase());
}

export function formatHours(hours: number): string {
    return `${(Math.round(hours * 10) / 10).toString().replace('.', ',')} h`;
}

/** Libellé "HH:MM" du créneau `index` (index === slotCount ⇒ heure de fin du jour). */
export function slotTime(day: Day, index: number): string {
    const start = new Date(day.startTime);
    const t = new Date(start.getTime() + index * day.intervalMinutes * 60000);
    const h = String(t.getHours()).padStart(2, '0');
    const m = String(t.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}
