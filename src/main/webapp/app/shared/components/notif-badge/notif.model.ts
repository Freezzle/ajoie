export type NotifType = 'count' | 'info' | 'warning' | 'danger';

export interface Notif {
    type: NotifType;
    /** 3, 12, '!' … (absent = point) */
    value?: number | string;
    /** Force l'affichage en point. */
    dot?: boolean;
}
