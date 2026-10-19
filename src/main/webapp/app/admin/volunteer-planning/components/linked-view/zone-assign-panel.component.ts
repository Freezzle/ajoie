import {ChangeDetectionStrategy, Component, computed, inject, output} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {VolunteerAvatarComponent} from './volunteer-avatar.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {Volunteer} from '../volunteer-planning-model';
import {
    assignOnRange,
    buildCellMap,
    buildUnavailableSet,
    cellKey,
    coverage,
    CoverageState,
    formatHours,
    rangeStatus,
    setNeed,
    slotTime,
    unassignOnRange,
    volunteerHours
} from '../volunteer-planning-utils';

type PanelGroup = 'here' | 'freeAll' | 'freePartial' | 'otherZone' | 'unavailable';

type PanelRow = {
    volunteer: Volunteer;
    group: PanelGroup;
    description: string;
    hours: string;
    canAdd: boolean;
    canComplete: boolean;
    canRemove: boolean;
    canForce: boolean;
};

type StripCell = { color: string | null; unavailable: boolean };

const GROUP_ORDER: PanelGroup[] = ['here', 'freeAll', 'freePartial', 'otherZone', 'unavailable'];

@Component({
               selector: 'zone-assign-panel',
               standalone: true,
               imports: [VolunteerAvatarComponent, TranslatePipe],
               templateUrl: './zone-assign-panel.component.html',
               styleUrls: ['./zone-assign-panel.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ZoneAssignPanelComponent {
    readonly store = inject(VolunteerPlanningStore);
    private readonly translate = inject(TranslateService);

    readonly closed = output<void>();

    readonly selection = computed(() => this.store.zoneSelection());

    readonly selectedCategory = computed(() => {
        const sel = this.selection();
        return sel ? (this.store.categoryMap().get(sel.categoryId) ?? null) : null;
    });

    readonly selectionLength = computed(() => {
        const sel = this.selection();
        return sel ? sel.end - sel.start + 1 : 0;
    });

    readonly selectionRange = computed(() => {
        const sel = this.selection();
        const day = this.store.selectedDay();
        if (!sel || !day) {
            return '';
        }
        return `${slotTime(day, sel.start)} → ${slotTime(day, sel.end + 1)}`;
    });

    readonly minLabel = computed(() => {
        const sel = this.selection();
        const day = this.store.selectedDay();
        if (!sel || !day) {
            return '0';
        }
        let min = Number.MAX_SAFE_INTEGER;
        let max = 0;
        for (let i = sel.start; i <= sel.end; i++) {
            const n = this.store.getNeed(sel.categoryId, i);
            min = Math.min(min, n);
            max = Math.max(max, n);
        }
        return min === max ? `${min}` : `${min}–${max}`;
    });

    readonly selectionCoverage = computed<{ assigned: number; min: number; state: CoverageState }>(() => {
        const sel = this.selection();
        const matrix = this.store.coverageMatrix();
        if (!sel) {
            return {assigned: 0, min: 0, state: 'none'};
        }
        const cells = matrix.get(sel.categoryId) ?? [];
        let assigned = 0;
        let min = 0;
        for (let i = sel.start; i <= sel.end; i++) {
            assigned += cells[i]?.assigned ?? 0;
            min += cells[i]?.min ?? 0;
        }
        return {assigned, min, state: coverage(assigned, min)};
    });

    readonly rows = computed<PanelRow[]>(() => {
        const sel = this.selection();
        const day = this.store.selectedDay();
        if (!sel || !day) {
            return [];
        }
        const length = sel.end - sel.start + 1;
        const categoryMap = this.store.categoryMap();

        const rows: PanelRow[] = this.store.visibleVolunteers().map(volunteer => {
            const status = rangeStatus(day, volunteer.id, sel.categoryId, sel.start, sel.end);
            const busyLabel = Object.entries(status.busy)
                                    .map(([cid, n]) => (categoryMap.get(cid)?.label ?? cid) + (length > 1 ? ` ${n}` : ''))
                                    .join(', ');

            let group: PanelGroup;
            let description: string;

            if (status.here) {
                group = 'here';
                const parts: string[] = [
                    length > 1
                        ? this.translate.instant('planningVolunteers.panel.assignedCount', {n: status.here, total: length})
                        : this.translate.instant('planningVolunteers.panel.assigned')
                ];
                if (status.free) {
                    parts.push(this.translate.instant('planningVolunteers.panel.freeCount', {n: status.free}));
                }
                description = parts.join(' · ');
            } else if (status.free === length) {
                group = 'freeAll';
                description = this.translate.instant('planningVolunteers.person.free');
            } else if (status.free) {
                group = 'freePartial';
                description = this.translate.instant('planningVolunteers.panel.freeOf', {free: status.free, total: length})
                    + (busyLabel ? ` · ${busyLabel}` : '')
                    + (status.unavailable
                        ? ` · ${this.translate.instant('planningVolunteers.panel.unavailableCount', {n: status.unavailable})}`
                        : '');
            } else if (busyLabel) {
                group = 'otherZone';
                description = this.translate.instant('planningVolunteers.panel.inOther', {zones: busyLabel});
            } else {
                group = 'unavailable';
                description = this.translate.instant('planningVolunteers.palette.unavailable');
            }

            return {
                volunteer,
                group,
                description,
                hours: formatHours(volunteerHours(day, volunteer.id)),
                canAdd: group === 'freeAll' || group === 'freePartial',
                canComplete: group === 'here' && status.free > 0,
                canRemove: group === 'here',
                canForce: group === 'otherZone'
            };
        });

        return rows.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
    });

    readonly groupedRows = computed<{ group: PanelGroup; rows: PanelRow[] }[]>(() => {
        const out: { group: PanelGroup; rows: PanelRow[] }[] = [];
        for (const row of this.rows()) {
            const last = out[out.length - 1];
            if (last?.group === row.group) {
                last.rows.push(row);
            } else {
                out.push({group: row.group, rows: [row]});
            }
        }
        return out;
    });

    /** Mini-frise colorée de la journée d'un bénévole. */
    readonly strips = computed<Map<string, StripCell[]>>(() => {
        const day = this.store.selectedDay();
        const result = new Map<string, StripCell[]>();
        if (!day) {
            return result;
        }
        const count = this.store.slotCount();
        const cells = buildCellMap(day);
        const unav = buildUnavailableSet(day);
        const categoryMap = this.store.categoryMap();

        for (const v of this.store.visibleVolunteers()) {
            const strip: StripCell[] = [];
            for (let i = 0; i < count; i++) {
                const key = cellKey(v.id, i);
                if (unav.has(key)) {
                    strip.push({color: null, unavailable: true});
                } else {
                    const catId = cells.get(key);
                    strip.push({color: catId ? (categoryMap.get(catId)?.color ?? null) : null, unavailable: false});
                }
            }
            result.set(v.id, strip);
        }
        return result;
    });

    hoursOf(volunteerId: string): string {
        return formatHours(this.store.hoursByVolunteer().get(volunteerId) ?? 0);
    }

    stripOf(volunteerId: string): StripCell[] {
        return this.strips().get(volunteerId) ?? [];
    }

    groupKey(group: PanelGroup): string {
        return `planningVolunteers.panel.${group === 'here' ? 'inZone' : group}`;
    }

    close(): void {
        this.store.zoneSelection.set(null);
        this.closed.emit();
    }

    focus(volunteerId: string): void {
        this.store.toggleFocus(volunteerId);
    }

    bumpMin(delta: number): void {
        const sel = this.selection();
        if (!sel) {
            return;
        }
        this.store.updateDay(day => {
            let next = day;
            for (let i = sel.start; i <= sel.end; i++) {
                const current = this.store.getNeed(sel.categoryId, i);
                next = setNeed(next, sel.categoryId, i, current + delta);
            }
            return next;
        });
    }

    add(volunteerId: string): void {
        const sel = this.selection();
        if (!sel) {
            return;
        }
        this.store.updateDay(day => assignOnRange(day, volunteerId, sel.categoryId, sel.start, sel.end, 'free-only'));
    }

    force(volunteerId: string): void {
        const sel = this.selection();
        if (!sel) {
            return;
        }
        this.store.updateDay(day => assignOnRange(day, volunteerId, sel.categoryId, sel.start, sel.end, 'force'));
    }

    remove(volunteerId: string): void {
        const sel = this.selection();
        if (!sel) {
            return;
        }
        this.store.updateDay(day => unassignOnRange(day, volunteerId, sel.categoryId, sel.start, sel.end));
    }
}
