import {Status} from '../../../admin/enumerations/status.model';
import {DISCARDED_STATUSES, FilterChip, FilterChipGroup, statusColor} from './entity-list.model';

/** Clé de la puce qui regroupe les statuts écartés (refusés et annulés). */
export const STATUS_CHIP_OUT = 'st_OUT';

const VISIBLE_STATUSES: Status[] = [
    Status.IN_VERIFICATION,
    Status.ACCEPTED,
    Status.VALIDATED,
    Status.CLOSED
];

/** Prédicats des puces de statut, indexés par clé de puce. */
export function statusChipPredicates<T>(statusOf: (item: T) => Status | null | undefined):
    Record<string, (item: T) => boolean> {
    const predicates: Record<string, (item: T) => boolean> = {};

    VISIBLE_STATUSES.forEach(status => {
        predicates[`st_${status}`] = item => statusOf(item) === status;
    });
    predicates[STATUS_CHIP_OUT] = item => DISCARDED_STATUSES.includes(statusOf(item) as Status);

    return predicates;
}

/**
 * Groupe de puces « Statut » : quatre statuts actifs puis « Écartés ».
 * Les libellés viennent de `{prefix}.{STATUT}` (au pluriel, genre de l'écran).
 */
export function buildStatusChipGroup<T>(items: T[],
                                        statusOf: (item: T) => Status | null | undefined,
                                        labelPrefix: string): FilterChipGroup {
    const predicates = statusChipPredicates(statusOf);

    const chips: FilterChip[] = [...VISIBLE_STATUSES.map(status => `st_${status}`), STATUS_CHIP_OUT]
        .map(key => ({
            key,
            labelKey: `${labelPrefix}.${key.replace('st_', '')}`,
            dotColor: key === STATUS_CHIP_OUT
                      ? statusColor(Status.REFUSED)
                      : statusColor(key.replace('st_', '') as Status),
            count: items.filter(predicates[key]).length,
            alwaysVisible: true
        }));

    return {
        key: 'status',
        labelKey: 'entityList.filterGroup.status',
        mode: 'or',
        chips
    };
}
