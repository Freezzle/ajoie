export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'BLOCKED';

export type UrgencyGroup = 'LATE' | 'TODAY' | 'THIS_WEEK' | 'LATER';

export type DateInputType = 'FIXED' | 'OFFSET';

export interface ISubtaskInstance {
    id: string;
    taskInstanceId: string;
    title: string;
    status: TaskStatus;
    dueDate: string | null;
    completedAt: string | null;
    sortOrder: number;
    description: string | null;
    snoozedUntil: string | null;
    /** Type de saisie pour dueDate : date fixe ou décalage J±N */
    dueDateType: DateInputType;
    /** Décalage en jours (ex : -14 = J-14, 3 = J+3). Null si dueDateType = 'FIXED'. */
    dueDateOffset: number | null;
    /** Type de saisie pour snoozedUntil. Null = pas de snooze. */
    snoozeUntilType: DateInputType | null;
    /** Décalage en jours pour le snooze. Null si snoozeUntilType = 'FIXED' ou absent. */
    snoozeOffset: number | null;
    responsible: string | null;
    supplierInfo: string | null;
}

export interface ITaskComment {
    id: string;
    taskInstanceId: string;
    authorName: string;
    body: string;
    createdAt: string;
}

export interface ITaskInstance {
    id: string;
    salonId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    dueDate: string | null;
    responsible: string | null;
    supplierInfo: string | null;
    completedAt: string | null;
    sortOrder: number;
    subtasks: ISubtaskInstance[];
    comments: ITaskComment[];
}

export interface INextSubtask {
    id: string;
    title: string;
    dueDate: string | null;
}

export interface ITaskFocusView {
    id: string;
    title: string;
    status: TaskStatus;
    dueDate: string | null;
    urgencyGroup: UrgencyGroup;
    responsible: string | null;
    supplierInfo: string | null;
    subtaskCount: number;
    subtaskDoneCount: number;
    nextSubtask: INextSubtask | null;
    completedAt: string | null;
    sortOrder: number;
}
