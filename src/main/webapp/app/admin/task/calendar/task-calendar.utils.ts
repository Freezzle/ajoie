import dayjs from 'dayjs/esm';

import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {effectiveDue, isActive, today} from '../shared/task-urgency.utils';

/** Au-delà de ce nombre d'éléments, un jour propose « +N autres ». */
export const MAX_PER_DAY = 2;

/** Découpage du temps proposé dans l'en-tête du calendrier. */
export type CalendarView = 'week' | 'month';

/** Vue utilisée quand aucune préférence n'existe. */
export const DEFAULT_VIEW: CalendarView = 'month';

/** Clé de préférence locale de la vue choisie (la date n'est jamais mémorisée). */
export const VIEW_STORAGE_KEY = 'task.calendar.view';

/** Période affichée : lundi de départ, dimanche de fin et la liste des jours. */
export interface CalendarRange {
    /** Premier lundi affiché (`YYYY-MM-DD`). */
    start: string;
    /** Dernier dimanche affiché (`YYYY-MM-DD`). */
    end: string;
    /** Jours affichés, du lundi au dimanche. */
    days: string[];
    /** Mois de référence (0–11) en vue Mois, `null` en vue Semaine. */
    month: number | null;
    /** 1ᵉʳ du mois de référence en vue Mois, `null` en vue Semaine. */
    monthDate: string | null;
    /** Numéro de semaine ISO en vue Semaine, `null` en vue Mois. */
    weekNumber: number | null;
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

/** Ramène une valeur quelconque sur une vue connue, sinon la vue par défaut. */
export function normalizeView(view: string | null | undefined): CalendarView {
    return view === 'week' || view === 'month' ? view : DEFAULT_VIEW;
}

/** Lundi (`YYYY-MM-DD`) de la semaine contenant `date`. */
export function mondayOf(date: string): string {
    const d = dayjs(date).startOf('day');
    const weekday = (d.day() + 6) % 7; // 0 = lundi, 6 = dimanche

    return d.subtract(weekday, 'day').format('YYYY-MM-DD');
}

/** Premier jour du mois de `date`. */
export function startOfMonth(date: string): string {
    return dayjs(date).startOf('month').format('YYYY-MM-DD');
}

/** Dernier jour du mois de `date`. */
export function endOfMonth(date: string): string {
    return dayjs(date).endOf('month').format('YYYY-MM-DD');
}

/**
 * Numéro de semaine ISO 8601 : la semaine 1 est celle qui contient le jeudi.
 * Calculé à la main pour ne pas dépendre d'un plugin dayjs chargé ailleurs.
 */
export function isoWeekNumber(date: string): number {
    const thursday = dayjs(mondayOf(date)).add(3, 'day');
    // Le 4 janvier appartient toujours à la semaine 1.
    const fourthOfJanuary = thursday.startOf('year').add(3, 'day').format('YYYY-MM-DD');
    const firstThursday = dayjs(mondayOf(fourthOfJanuary)).add(3, 'day');

    return thursday.diff(firstThursday, 'week') + 1;
}

/** Période affichée pour une vue et une date d'ancrage. */
export function calendarRange(view: CalendarView, anchor: string = today()): CalendarRange {
    const monthView = view === 'month';
    const start = monthView ? mondayOf(startOfMonth(anchor)) : mondayOf(anchor);
    const end = monthView ? addDays(mondayOf(endOfMonth(anchor)), 6) : addDays(start, 6);
    const count = dayjs(end).diff(dayjs(start), 'day') + 1;
    const days = Array.from({length: count}, (_, index) => addDays(start, index));

    return {
        start,
        end,
        days,
        month: monthView ? dayjs(anchor).month() : null,
        monthDate: monthView ? startOfMonth(anchor) : null,
        weekNumber: monthView ? null : isoWeekNumber(start)
    };
}

/** Vrai si le jour appartient au mois de référence (toujours vrai en vue Semaine). */
export function isInMonth(day: string, range: CalendarRange): boolean {
    return range.month === null || dayjs(day).month() === range.month;
}

/**
 * Nouvelle ancre après un clic sur ‹ ou › : ±1 semaine, ou ±1 mois en revenant
 * au 1ᵉʳ du mois pour éviter les sauts du 31 au 28.
 */
export function shiftAnchor(view: CalendarView, anchor: string, direction: -1 | 1): string {
    return view === 'week'
           ? addDays(mondayOf(anchor), 7 * direction)
           : dayjs(startOfMonth(anchor)).add(direction, 'month').format('YYYY-MM-DD');
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
 * Les `CANCELLED` sont ignorées. Une sous-tâche active en retard reste affichée dans
 * sa case passée ; la bande « En retard » la reprend en tête de grille.
 */
export function subtasksForDay(subtasks: IFlatSubtask[], day: string): IFlatSubtask[] {
    return subtasks
        .filter(subtask => subtask.status !== 'CANCELLED')
        .filter(subtask => effectiveDue(subtask) === day)
        .sort(compareInDay);
}

/** Répartition par jour sur toute la période, indexée par date. */
export function groupByDay(subtasks: IFlatSubtask[], range: CalendarRange): Record<string, IFlatSubtask[]> {
    const map: Record<string, IFlatSubtask[]> = {};

    range.days.forEach(day => {
        map[day] = subtasksForDay(subtasks, day);
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

/** Vrai le 1ᵉʳ du mois. */
export function isFirstOfMonth(day: string): boolean {
    return dayNumber(day) === 1;
}

/** Mois en toutes lettres avec l'année, par exemple « Janvier 2027 ». */
export function monthTitle(day: string): string {
    const label = new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {month: 'long', year: 'numeric'});

    return label.charAt(0).toLocaleUpperCase('fr') + label.slice(1);
}

/** Mois en toutes lettres seul, par exemple « décembre ». */
export function longMonthLabel(day: string): string {
    return new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {month: 'long'});
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

/** Jour de la semaine en toutes lettres avec majuscule, par exemple « Lundi ». */
export function longWeekday(day: string): string {
    const label = new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {weekday: 'long'});

    return label.charAt(0).toLocaleUpperCase('fr') + label.slice(1);
}

/** Jour et mois abrégés, par exemple « 28 déc. ». */
export function shortDayMonth(day: string): string {
    return new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {day: 'numeric', month: 'short'});
}
