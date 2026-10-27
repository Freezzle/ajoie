import dayjs from 'dayjs/esm';

import {
    IFlatSubtask,
    INextSubtask,
    ISubtaskInstance,
    ITaskInstance,
    TaskStatus,
    UrgencyGroup
} from '../model/task-instance.interface';

/** Urgence d'une sous-tâche : clé de groupe et de tri. */
export type Urgency = UrgencyGroup;

/** Ordre d'affichage des groupes d'échéance. */
export const URGENCY_ORDER: Urgency[] = ['LATE', 'TODAY', 'WEEK', 'LATER', 'NODATE', 'DONE'];

/** Ordre d'affichage des groupes de statut : le plus bloquant en premier. */
export const TASK_STATUS_ORDER: TaskStatus[] = ['BLOCKED', 'IN_PROGRESS', 'PENDING', 'DONE'];

/** Statuts proposés dans le panneau : `CANCELLED` n'est jamais offert. */
export const SELECTABLE_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

/** Palette des avatars de responsable, dans l'ordre d'attribution. */
export const RESPONSIBLE_PALETTE: string[] = [
    'var(--app-primary)',
    'var(--app-accent)',
    'var(--app-offer)',
    'var(--app-amber)',
    'var(--app-share)',
    'var(--app-exit)'
];

/** Clé du groupe « Sans responsable », placé en tête. */
export const NO_RESPONSIBLE_KEY = '__none__';

/** Aujourd'hui au format `YYYY-MM-DD`, minuit local. */
export function today(): string {
    return dayjs().startOf('day').format('YYYY-MM-DD');
}

/** Une sous-tâche est active tant qu'elle n'est ni terminée ni annulée. */
export function isActive(subtask: ISubtaskInstance): boolean {
    return subtask.status !== 'DONE' && subtask.status !== 'CANCELLED';
}

/** Vrai quand la limite a été repoussée à une date différente de l'échéance d'origine. */
export function isMoved(subtask: ISubtaskInstance): boolean {
    return isActive(subtask) &&
           !!subtask.snoozedUntil &&
           !!subtask.dueDate &&
           subtask.snoozedUntil !== subtask.dueDate;
}

/** Échéance effective : la date repoussée si elle existe, sinon l'échéance d'origine. */
export function effectiveDue(subtask: ISubtaskInstance): string | null {
    return isMoved(subtask) ? subtask.snoozedUntil : subtask.dueDate;
}

/** Nombre de jours entre aujourd'hui et une date (`null` si la date est absente). */
export function daysUntil(date: string | null | undefined): number | null {
    if (!date) {
        return null;
    }

    return dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
}

/** Jours restants avant l'échéance effective. */
export function daysLeft(subtask: ISubtaskInstance): number | null {
    return daysUntil(effectiveDue(subtask));
}

/** Urgence d'une sous-tâche, calculée sur son échéance effective. */
export function urgency(subtask: ISubtaskInstance): Urgency {
    if (!isActive(subtask)) {
        return 'DONE';
    }

    const days = daysLeft(subtask);
    if (days === null) {
        return 'NODATE';
    }
    if (days < 0) {
        return 'LATE';
    }
    if (days === 0) {
        return 'TODAY';
    }

    return days <= 7 ? 'WEEK' : 'LATER';
}

/** Vrai si la sous-tâche est active et en retard. */
export function isLate(subtask: ISubtaskInstance): boolean {
    return urgency(subtask) === 'LATE';
}

/** Couleur de thème d'un groupe d'échéance. */
export function urgencyColor(key: string): string {
    switch (key) {
        case 'LATE':
            return 'var(--app-danger)';
        case 'TODAY':
            return 'var(--app-warning)';
        case 'WEEK':
            return 'var(--app-primary)';
        case 'DONE':
            return 'var(--app-status-validated)';
        default:
            return 'var(--app-text-muted)';
    }
}

/** Couleur de thème d'un statut de sous-tâche. */
export function statusColorOf(status: string): string {
    switch (status) {
        case 'IN_PROGRESS':
            return 'var(--app-primary)';
        case 'BLOCKED':
            return 'var(--app-offer)';
        case 'DONE':
            return 'var(--app-status-validated)';
        default:
            return 'var(--app-text-muted)';
    }
}

/** Responsable effectif : celui de la sous-tâche, sinon celui de la tâche. */
export function ownerOf(subtask: ISubtaskInstance, task: ITaskInstance | null | undefined): string | null {
    return subtask.responsible ?? task?.responsible ?? null;
}

/** Liste triée et dédoublonnée des responsables connus du salon. */
export function knownResponsibles(tasks: ITaskInstance[]): string[] {
    const names = new Set<string>();

    tasks.forEach(task => {
        if (task.responsible) {
            names.add(task.responsible);
        }
        (task.subtasks ?? []).forEach(subtask => {
            if (subtask.responsible) {
                names.add(subtask.responsible);
            }
        });
    });

    return [...names].sort((a, b) => a.localeCompare(b, 'fr'));
}

/** Couleur stable d'un responsable : son rang dans la liste triée, modulo la palette. */
export function responsibleColor(name: string | null | undefined, known: string[]): string {
    if (!name) {
        return 'var(--app-warning)';
    }

    const index = known.indexOf(name);

    return RESPONSIBLE_PALETTE[(index < 0 ? 0 : index) % RESPONSIBLE_PALETTE.length];
}

/** Initiales d'un responsable : deux premières lettres en majuscules. */
export function initialsOf(name: string | null | undefined): string {
    const trimmed = (name ?? '').trim();
    if (!trimmed) {
        return '?';
    }

    const parts = trimmed.split(/\s+/);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : trimmed.slice(0, 2);

    return letters.toLocaleUpperCase('fr');
}

/** Comparateur des sous-tâches : échéance effective croissante, sans date en dernier. */
export function compareSubtasks(a: ISubtaskInstance, b: ISubtaskInstance): number {
    const dueA = effectiveDue(a);
    const dueB = effectiveDue(b);

    if (dueA !== dueB) {
        if (!dueA) {
            return 1;
        }
        if (!dueB) {
            return -1;
        }

        return dueA.localeCompare(dueB);
    }

    return a.sortOrder - b.sortOrder;
}

/** Sous-tâches d'une tâche triées par échéance effective. */
export function sortedSubtasks(task: ITaskInstance): ISubtaskInstance[] {
    return [...(task.subtasks ?? [])].sort(compareSubtasks);
}

/** Première sous-tâche active, triée par échéance effective. */
export function nextSubtask(task: ITaskInstance): INextSubtask | null {
    const next = sortedSubtasks(task).find(isActive);

    return next ? {id: next.id, title: next.title, dueDate: effectiveDue(next)} : null;
}

/** Urgence d'une tâche : celle de sa prochaine sous-tâche active, sinon DONE/NODATE. */
export function taskUrgency(task: ITaskInstance): Urgency {
    const subtasks = task.subtasks ?? [];
    const next = sortedSubtasks(task).find(isActive);

    if (next) {
        return urgency(next);
    }

    return subtasks.length > 0 ? 'DONE' : 'NODATE';
}

/** Effectifs d'une liste de sous-tâches, utilisés par les barres et les résumés. */
export interface SubtaskCounts {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
    late: number;
    active: number;
}

export function countSubtasks(subtasks: ISubtaskInstance[]): SubtaskCounts {
    return {
        total: subtasks.length,
        done: subtasks.filter(subtask => subtask.status === 'DONE').length,
        inProgress: subtasks.filter(subtask => subtask.status === 'IN_PROGRESS').length,
        blocked: subtasks.filter(subtask => subtask.status === 'BLOCKED').length,
        late: subtasks.filter(isLate).length,
        active: subtasks.filter(isActive).length
    };
}

/**
 * Score d'urgence d'une tâche : plus il est haut, plus la tâche remonte.
 * Une tâche entièrement terminée est reléguée en fin de liste.
 */
export function taskScore(task: ITaskInstance): number {
    const subtasks = task.subtasks ?? [];
    const counts = countSubtasks(subtasks);
    const todayCount = subtasks.filter(subtask => urgency(subtask) === 'TODAY').length;
    const allDone = subtasks.length > 0 && counts.active === 0;

    return counts.late * 100 + counts.blocked * 50 + todayCount * 30 - (allDone ? 1000 : 0);
}

/** Comparateur des tâches : score décroissant, puis échéance de la prochaine sous-tâche. */
export function compareTasks(a: ITaskInstance, b: ITaskInstance): number {
    const scoreDiff = taskScore(b) - taskScore(a);
    if (scoreDiff !== 0) {
        return scoreDiff;
    }

    const dueA = nextSubtask(a)?.dueDate ?? null;
    const dueB = nextSubtask(b)?.dueDate ?? null;

    if (dueA !== dueB) {
        if (!dueA) {
            return 1;
        }
        if (!dueB) {
            return -1;
        }

        return dueA.localeCompare(dueB);
    }

    return a.sortOrder - b.sortOrder;
}

/** Aplatit toutes les sous-tâches du salon en leur attachant leur tâche parente. */
export function flatten(tasks: ITaskInstance[]): IFlatSubtask[] {
    return tasks.flatMap(task => (task.subtasks ?? []).map(subtask => ({...subtask, parentTask: task})));
}

/** Nouvelle limite après un report de `days` jours, jamais calculée depuis le passé. */
export function snoozeTarget(subtask: ISubtaskInstance, days: number): string {
    const base = effectiveDue(subtask);
    const start = base && dayjs(base).isAfter(dayjs().startOf('day')) ? dayjs(base) : dayjs();

    return start.startOf('day').add(days, 'day').format('YYYY-MM-DD');
}

/** Normalise une date (chaîne ISO ou `Date`) au format `YYYY-MM-DD`. */
export function toLocalDate(value: string | Date | null | undefined): string | null {
    return value ? dayjs(value).format('YYYY-MM-DD') : null;
}

/** Date courte localisée, par exemple « mar. 27 oct. ». */
export function formatShortDate(date: string | null | undefined): string {
    if (!date) {
        return '';
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString('fr-CH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}
