import dayjs from 'dayjs/esm';

import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {effectiveDue, isActive, today} from '../shared/task-urgency.utils';

/** Choix de durée proposés dans l'en-tête, en semaines. */
export const WEEK_OPTIONS: number[] = [1, 2, 3, 4, 6, 8];

/** Nombre de semaines par défaut quand aucune préférence n'existe. */
export const DEFAULT_WEEKS = 2;

/** Au-delà de ce nombre d'éléments, un jour propose « +N autres ». */
export const MAX_PER_DAY = 4;

/** Clé de préférence locale du nombre de semaines choisi. */
export const WEEKS_STORAGE_KEY = 'task.calendar.weeks';

/** Période affichée : lundi de départ, dimanche de fin et la liste des jours. */
export interface CalendarRange {
    /** Lundi de la semaine en cours (`YYYY-MM-DD`). */
    start: string;
    /** Dernier dimanche affiché (`YYYY-MM-DD`). */
    end: string;
    /** `weeks × 7` jours, du lundi au dimanche. */
    days: string[];
}

/** Compteurs de l'en-tête de la vue. */
export interface CalendarCounts {
    /** Actives dont l'échéance effective est dans [aujourd'hui, end]. */
    toDo: number;
    /** Actives dont l'échéance effective est aujourd'hui. */
    today: number;
    /** Actives en retard. */
    late: number;
}

/** Ordre de tri des statuts dans une case : le plus bloquant d'abord. */
const DAY_STATUS_ORDER: Record<string, number> = {BLOCKED: 0, IN_PROGRESS: 1, PENDING: 2};

/** Ramène un nombre de semaines à une valeur autorisée, sinon le défaut. */
export function normalizeWeeks(weeks: number | null | undefined): number {
    return weeks != null && WEEK_OPTIONS.includes(weeks) ? weeks : DEFAULT_WEEKS;
}

/** Lundi (`YYYY-MM-DD`) de la semaine contenant `date`. */
export function mondayOf(date: string): string {
    const d = dayjs(date).startOf('day');
    const weekday = (d.day() + 6) % 7; // 0 = lundi, 6 = dimanche

    return d.subtract(weekday, 'day').format('YYYY-MM-DD');
}

/** Date `YYYY-MM-DD` décalée de `n` jours. */
export function addDays(date: string, n: number): string {
    return dayjs(date).startOf('day').add(n, 'day').format('YYYY-MM-DD');
}

/** Vrai si `day` est un samedi ou un dimanche. */
export function isWeekend(day: string): boolean {
    const weekday = dayjs(day).day();

    return weekday === 0 || weekday === 6;
}

/** Période affichée pour un nombre de semaines donné, à partir d'aujourd'hui. */
export function calendarRange(weeks: number, from: string = today()): CalendarRange {
    const count = normalizeWeeks(weeks) * 7;
    const start = mondayOf(from);
    const end = addDays(start, count - 1);
    const days = Array.from({length: count}, (_, index) => addDays(start, index));

    return {start, end, days};
}

/** Tri des sous-tâches dans une case : actives d'abord, puis statut, sortOrder, id. */
export function compareInDay(a: IFlatSubtask, b: IFlatSubtask): number {
    const activeDiff = Number(!isActive(a)) - Number(!isActive(b));
    if (activeDiff !== 0) {
        return activeDiff;
    }

    const statusDiff = (DAY_STATUS_ORDER[a.status] ?? 3) - (DAY_STATUS_ORDER[b.status] ?? 3);
    if (statusDiff !== 0) {
        return statusDiff;
    }

    if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
    }

    return a.id.localeCompare(b.id);
}

/**
 * Sous-tâches placées dans la case d'un jour donné.
 *
 * Les `CANCELLED` sont ignorées. Une sous-tâche active n'apparaît jamais dans une
 * case passée (elle rejoint la bande « En retard ») ; une terminée y reste.
 */
export function subtasksForDay(subtasks: IFlatSubtask[],
                               day: string,
                               todayDate: string = today()): IFlatSubtask[] {
    const past = day < todayDate;

    return subtasks
        .filter(subtask => subtask.status !== 'CANCELLED')
        .filter(subtask => effectiveDue(subtask) === day)
        .filter(subtask => !(past && isActive(subtask)))
        .sort(compareInDay);
}

/** Répartition par jour sur toute la période, indexée par date. */
export function groupByDay(subtasks: IFlatSubtask[],
                          range: CalendarRange,
                          todayDate: string = today()): Record<string, IFlatSubtask[]> {
    const map: Record<string, IFlatSubtask[]> = {};

    range.days.forEach(day => {
        map[day] = subtasksForDay(subtasks, day, todayDate);
    });

    return map;
}

/** Sous-tâches actives en retard, de la plus ancienne à la plus récente. */
export function lateSubtasks(subtasks: IFlatSubtask[], todayDate: string = today()): IFlatSubtask[] {
    return subtasks
        .filter(subtask => isActive(subtask))
        .filter(subtask => {
            const due = effectiveDue(subtask);

            return due !== null && due < todayDate;
        })
        .sort((a, b) => (effectiveDue(a) ?? '').localeCompare(effectiveDue(b) ?? ''));
}

/** Nombre de sous-tâches actives dans une liste (compteur d'en-tête de case). */
export function activeCount(subtasks: ISubtaskInstance[]): number {
    return subtasks.filter(isActive).length;
}

/** Compteurs de l'en-tête de la vue, sur la période affichée. */
export function calendarCounts(subtasks: IFlatSubtask[],
                              range: CalendarRange,
                              todayDate: string = today()): CalendarCounts {
    const inRange = subtasks
        .filter(subtask => isActive(subtask))
        .filter(subtask => {
            const due = effectiveDue(subtask);

            return due !== null && due >= todayDate && due <= range.end;
        });

    return {
        toDo: inRange.length,
        today: inRange.filter(subtask => effectiveDue(subtask) === todayDate).length,
        late: lateSubtasks(subtasks, todayDate).length
    };
}

/** Vrai si `day` tombe pendant le salon (bornes incluses). */
export function isSalonDay(day: string,
                          startingDate: string | null | undefined,
                          endingDate: string | null | undefined): boolean {
    if (!startingDate || !endingDate) {
        return false;
    }

    return day >= startingDate && day <= endingDate;
}

/** Mois abrégé localisé d'un jour, par exemple « oct. ». */
export function monthLabel(day: string): string {
    return new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {month: 'short'});
}

/** Numéro du jour dans le mois. */
export function dayNumber(day: string): number {
    return dayjs(day).date();
}

/** Vrai le 1ᵉʳ du mois ou pour le tout premier jour affiché (on ajoute le mois). */
export function showsMonth(day: string, range: CalendarRange): boolean {
    return dayNumber(day) === 1 || day === range.start;
}

/** Jour long localisé avec majuscule initiale, par exemple « Lundi 2 novembre ». */
export function longDayLabel(day: string): string {
    const label = new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return label.charAt(0).toLocaleUpperCase('fr') + label.slice(1);
}

/** Jour abrégé localisé, par exemple « lun. ». */
export function shortWeekday(day: string): string {
    return new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {weekday: 'short'});
}
