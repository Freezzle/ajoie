import {ChangeDetectionStrategy, Component, computed, HostListener, inject, OnDestroy} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerAvatarComponent} from './volunteer-avatar.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {Category} from '../volunteer-planning-model';
import {formatHours, NAME_COLUMN_WIDTH, slotTime} from '../volunteer-planning-utils';

type ZoneRow = {
    category: Category;
    height: number;
    assignedHours: string;
    minHours: string;
    cells: { slot: number; volunteerIds: string[]; seats: number[]; state: string; min: number; assigned: number }[];
};

/** Nombre de pastilles affichées par ligne dans une case de zone. */
const SEATS_PER_LINE = 2;

@Component({
               selector: 'planning-zones',
               standalone: true,
               imports: [VolunteerAvatarComponent, TranslatePipe],
               templateUrl: './planning-zones.component.html',
               styleUrls: ['./planning-zones.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningZonesComponent implements OnDestroy {
    readonly store = inject(VolunteerPlanningStore);

    readonly nameWidth = NAME_COLUMN_WIDTH;
    readonly slotW = this.store.slotW;
    readonly slotWCss = this.store.slotWCss;
    readonly trackWidth = this.store.trackWidth;

    /** Taille d'un avatar / d'une pastille, pour en loger exactement deux par ligne. */
    readonly seatSize = computed(() => {
        const inner = this.slotW() - 4 - 6 - 2 * (SEATS_PER_LINE - 1);
        return Math.min(20, Math.max(8, Math.floor(inner / SEATS_PER_LINE)));
    });

    readonly rows = computed<ZoneRow[]>(() => {
        const day = this.store.selectedDay();
        const count = this.store.slotCount();
        const occupancy = this.store.zoneOccupancy();
        const matrix = this.store.coverageMatrix();
        const seatSize = this.seatSize();
        const interval = day?.intervalMinutes ?? 60;

        return this.store.categories().map(category => {
            const occ = occupancy.get(category.id) ?? [];
            const cov = matrix.get(category.id) ?? [];
            let maxAvatars = 1;
            let assignedSlots = 0;
            let minSlots = 0;

            const cells = Array.from({length: count}, (_, slot) => {
                const volunteerIds = occ[slot] ?? [];
                const cell = cov[slot] ?? {assigned: 0, min: 0, state: 'none'};
                maxAvatars = Math.max(maxAvatars, volunteerIds.length, cell.min);
                assignedSlots += cell.assigned;
                minSlots += cell.min;
                const missing = Math.max(0, cell.min - volunteerIds.length);
                return {
                    slot,
                    volunteerIds,
                    seats: Array.from({length: missing}, (__, i) => i),
                    state: cell.state,
                    min: cell.min,
                    assigned: cell.assigned
                };
            });

            return {
                category,
                height: Math.max(40, Math.ceil(maxAvatars / SEATS_PER_LINE) * (seatSize + 2) + 10),
                assignedHours: formatHours((assignedSlots * interval) / 60),
                minHours: formatHours((minSlots * interval) / 60),
                cells
            };
        });
    });

    readonly freeBySlot = computed(() => this.store.freeBySlot());

    private selecting = false;

    private readonly onPointerMove = (event: PointerEvent): void => {
        if (!this.selecting) {
            return;
        }
        const sel = this.store.zoneSelection();
        if (!sel) {
            this.selecting = false;
            return;
        }
        const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const cell = el?.closest<HTMLElement>('.zcell');
        if (cell?.dataset['cat'] !== sel.categoryId) {
            return;
        }
        const slot = Number(cell.dataset['slot']);
        const start = Math.min(sel.anchor, slot);
        const end = Math.max(sel.anchor, slot);
        if (start !== sel.start || end !== sel.end) {
            this.store.zoneSelection.set({...sel, start, end});
        }
    };

    volunteerLabel(volunteerId: string): string {
        return this.store.planning().volunteers.find(v => v.id === volunteerId)?.label ?? volunteerId;
    }

    cellLeft(slot: number): number {
        return slot * this.slotW() + 2;
    }

    cellWidth(): number {
        return this.slotW() - 4;
    }

    cellTitle(row: ZoneRow, slot: number): string {
        const day = this.store.selectedDay();
        const cell = row.cells[slot];
        const time = day ? slotTime(day, slot) : '';
        return `${row.category.label} ${time} · ${cell.assigned}/${cell.min}`;
    }

    isSelected(categoryId: string, slot: number): boolean {
        const sel = this.store.zoneSelection();
        return !!sel && sel.categoryId === categoryId && slot >= sel.start && slot <= sel.end;
    }

    onPointerDown(event: PointerEvent): void {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }
        const cell = (event.target as HTMLElement).closest<HTMLElement>('.zcell');
        if (!cell) {
            return;
        }
        event.preventDefault();
        const slot = Number(cell.dataset['slot']);
        const categoryId = cell.dataset['cat']!;
        this.store.zoneSelection.set({categoryId, start: slot, end: slot, anchor: slot});
        this.store.blockSelection.set(null);
        this.selecting = true;
        window.addEventListener('pointermove', this.onPointerMove);
    }

    @HostListener('window:pointerup')
    @HostListener('window:pointercancel')
    @HostListener('window:blur')
    onPointerUp(): void {
        if (!this.selecting) {
            return;
        }
        this.selecting = false;
        window.removeEventListener('pointermove', this.onPointerMove);
    }

    ngOnDestroy(): void {
        this.onPointerUp();
    }
}
