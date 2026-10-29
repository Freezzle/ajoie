import {ChangeDetectionStrategy, Component, computed, HostListener, inject, OnDestroy, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerAvatarComponent} from '../../../../shared/components/volunteer-avatar/volunteer-avatar.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {applyToolRange, cellKey, formatHours} from '../volunteer-planning-utils';

type GridCell = {
    slot: number;
    color: string | null;
    icon: string | null;
    unavailable: boolean;
    runStart: boolean;
    runEnd: boolean;
};

type GridRow = {
    volunteerId: string;
    label: string;
    hours: string;
    overtime: boolean;
    cells: GridCell[];
};

@Component({
               selector: 'mobile-person-grid',
               standalone: true,
               imports: [VolunteerAvatarComponent, TranslatePipe],
               templateUrl: './mobile-person-grid.component.html',
               styleUrls: ['./mobile-person-grid.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MobilePersonGridComponent implements OnDestroy {
    readonly store = inject(VolunteerPlanningStore);

    readonly openPerson = output<string>();
    readonly openMinimums = output<void>();

    readonly paintMode = computed(() => this.store.mobilePaintMode());

    readonly shortLabels = computed(() => {
        const day = this.store.selectedDay();
        if (!day) {
            return [];
        }
        return this.store.timeSlots().map(slot => {
            const [h, m] = slot.label.split(':');
            return m === '00' ? `${Number(h)}h` : `:${m}`;
        });
    });

    readonly rows = computed<GridRow[]>(() => {
        const day = this.store.selectedDay();
        if (!day) {
            return [];
        }
        const count = this.store.slotCount();
        const cells = this.store.cellMap();
        const unav = this.store.unavailableSet();
        const categoryMap = this.store.categoryMap();
        const hours = this.store.hoursByVolunteer();

        return this.store.visibleVolunteers().map(v => {
            const rowCells: GridCell[] = [];
            for (let i = 0; i < count; i++) {
                const key = cellKey(v.id, i);
                if (unav.has(key)) {
                    rowCells.push({slot: i, color: null, icon: null, unavailable: true, runStart: false, runEnd: false});
                    continue;
                }
                const catId = cells.get(key);
                if (!catId) {
                    rowCells.push({slot: i, color: null, icon: null, unavailable: false, runStart: false, runEnd: false});
                    continue;
                }
                const same = (j: number) => j >= 0 && j < count && cells.get(cellKey(v.id, j)) === catId && !unav.has(cellKey(v.id, j));
                const cat = categoryMap.get(catId);
                rowCells.push({
                                  slot: i,
                                  color: cat?.color ?? null,
                                  icon: same(i - 1) ? null : (cat?.icon ?? 'pi pi-circle-fill'),
                                  unavailable: false,
                                  runStart: !same(i - 1),
                                  runEnd: !same(i + 1)
                              });
            }
            const h = hours.get(v.id) ?? 0;
            return {volunteerId: v.id, label: v.label, hours: formatHours(h), overtime: h > 6, cells: rowCells};
        });
    });

    readonly footerRows = computed(() => this.store.categories().map(cat => ({
        category: cat,
        cells: this.store.coverageMatrix().get(cat.id) ?? []
    })));

    private painting = false;
    private tracking = false;
    private lastKey: string | null = null;
    private tapStart: { x: number; y: number; volunteerId: string; slot: number } | null = null;

    togglePaintMode(): void {
        this.store.mobilePaintMode.set(!this.store.mobilePaintMode());
    }

    selectTool(kind: 'ERASER' | 'UNAVAILABLE'): void {
        this.store.tool.set({kind});
    }

    selectCategory(categoryId: string): void {
        this.store.tool.set({kind: 'CATEGORY', categoryId});
    }

    isCategorySelected(categoryId: string): boolean {
        const tool = this.store.tool();
        return tool.kind === 'CATEGORY' && tool.categoryId === categoryId;
    }

    onPointerDown(event: PointerEvent): void {
        if (this.store.isReadOnly()) {
            return;
        }
        const cell = (event.target as HTMLElement).closest<HTMLElement>('td.c');
        if (!cell) {
            return;
        }
        const volunteerId = cell.dataset['v']!;
        const slot = Number(cell.dataset['slot']);

        if (this.store.mobilePaintMode()) {
            event.preventDefault();
            this.painting = true;
            this.lastKey = `${volunteerId}:${slot}`;
            this.apply(volunteerId, slot);
        } else {
            this.tapStart = {x: event.clientX, y: event.clientY, volunteerId, slot};
        }
        this.startTracking();
    }

    private readonly onPointerMove = (event: PointerEvent): void => {
        if (this.tapStart && Math.hypot(event.clientX - this.tapStart.x, event.clientY - this.tapStart.y) > 8) {
            this.tapStart = null;
        }
        if (!this.painting) {
            return;
        }
        const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const cell = el?.closest<HTMLElement>('td.c');
        if (!cell) {
            return;
        }
        const volunteerId = cell.dataset['v']!;
        const slot = Number(cell.dataset['slot']);
        const key = `${volunteerId}:${slot}`;
        if (key === this.lastKey) {
            return;
        }
        this.lastKey = key;
        this.apply(volunteerId, slot);
    };

    @HostListener('window:pointerup')
    @HostListener('window:pointercancel')
    @HostListener('window:blur')
    onPointerUp(): void {
        if (this.tapStart) {
            this.apply(this.tapStart.volunteerId, this.tapStart.slot);
            this.tapStart = null;
        }
        this.painting = false;
        this.lastKey = null;
        this.stopTracking();
    }

    /** Le suivi du pointeur n'est actif que pendant un geste, pour ne pas déclencher un cycle par `pointermove`. */
    private startTracking(): void {
        if (this.tracking) {
            return;
        }
        this.tracking = true;
        window.addEventListener('pointermove', this.onPointerMove);
    }

    private stopTracking(): void {
        if (!this.tracking) {
            return;
        }
        this.tracking = false;
        window.removeEventListener('pointermove', this.onPointerMove);
    }

    ngOnDestroy(): void {
        this.tapStart = null;
        this.painting = false;
        this.stopTracking();
    }

    private apply(volunteerId: string, slot: number): void {
        const tool = this.store.tool();
        this.store.updateDay(day => applyToolRange(day, volunteerId, slot, slot + 1, tool));
    }
}
