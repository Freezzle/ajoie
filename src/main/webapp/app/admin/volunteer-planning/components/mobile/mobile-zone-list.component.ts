import {ChangeDetectionStrategy, Component, computed, inject, output, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerAvatarComponent} from '../../../../shared/components/volunteer-avatar/volunteer-avatar.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {slotTime} from '../volunteer-planning-utils';

@Component({
               selector: 'mobile-zone-list',
               standalone: true,
               imports: [VolunteerAvatarComponent, TranslatePipe],
               templateUrl: './mobile-zone-list.component.html',
               styleUrls: ['./mobile-zone-list.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MobileZoneListComponent {
    readonly store = inject(VolunteerPlanningStore);

    readonly openAssign = output<void>();
    readonly openRoster = output<void>();
    readonly openPerson = output<string>();

    readonly activeCategoryId = signal<string>('');

    readonly categoryId = computed(() => {
        const active = this.activeCategoryId();
        const categories = this.store.categories();
        return categories.some(c => c.id === active) ? active : (categories[0]?.id ?? '');
    });

    readonly category = computed(() => this.store.categoryMap().get(this.categoryId()) ?? null);

    readonly chips = computed(() => {
        const matrix = this.store.coverageMatrix();
        return this.store.categories().map(category => {
            const cells = matrix.get(category.id) ?? [];
            const holes = cells.reduce((acc, c) => acc + Math.max(0, c.min - c.assigned), 0);
            return {category, holes};
        });
    });

    readonly selection = computed(() => {
        const sel = this.store.zoneSelection();
        return sel?.categoryId === this.categoryId() ? sel : null;
    });

    readonly selectionRange = computed(() => {
        const sel = this.selection();
        const day = this.store.selectedDay();
        if (!sel || !day) {
            return '';
        }
        return `${slotTime(day, sel.start)} → ${slotTime(day, sel.end + 1)}`;
    });

    readonly selectionLength = computed(() => {
        const sel = this.selection();
        return sel ? sel.end - sel.start + 1 : 0;
    });

    readonly rows = computed(() => {
        const day = this.store.selectedDay();
        const categoryId = this.categoryId();
        if (!day || !categoryId) {
            return [];
        }
        const occupancy = this.store.zoneOccupancy().get(categoryId) ?? [];
        const cells = this.store.coverageMatrix().get(categoryId) ?? [];
        const free = this.store.freeBySlot();

        return this.store.timeSlots().map(slot => {
            const volunteerIds = occupancy[slot.index] ?? [];
            const cov = cells[slot.index] ?? {assigned: 0, min: 0, state: 'none' as const};
            return {
                slot: slot.index,
                from: slotTime(day, slot.index),
                to: slotTime(day, slot.index + 1),
                volunteerIds,
                seats: Array.from({length: Math.max(0, cov.min - volunteerIds.length)}, (_, i) => i),
                state: cov.state,
                label: cov.state === 'none' ? '–' : `${cov.assigned}/${cov.min}`,
                free: free[slot.index] ?? 0
            };
        });
    });

    readonly focusedVolunteer = computed(() => {
        const id = this.store.focusVolunteerId();
        return id ? (this.store.planning().volunteers.find(v => v.id === id) ?? null) : null;
    });

    volunteerLabel(volunteerId: string): string {
        return this.store.planning().volunteers.find(v => v.id === volunteerId)?.label ?? volunteerId;
    }

    selectCategory(categoryId: string): void {
        this.activeCategoryId.set(categoryId);
        this.store.zoneSelection.set(null);
    }

    isSelected(slot: number): boolean {
        const sel = this.selection();
        return !!sel && slot >= sel.start && slot <= sel.end;
    }

    tapSlot(slot: number): void {
        const current = this.selection();
        const categoryId = this.categoryId();
        if (!current) {
            this.store.zoneSelection.set({categoryId, start: slot, end: slot, anchor: slot});
            return;
        }
        if (current.start === current.end) {
            if (slot === current.start) {
                this.store.zoneSelection.set(null);
            } else {
                this.store.zoneSelection.set({
                                                 ...current,
                                                 start: Math.min(current.start, slot),
                                                 end: Math.max(current.end, slot)
                                             });
            }
            return;
        }
        this.store.zoneSelection.set({categoryId, start: slot, end: slot, anchor: slot});
    }

    clearSelection(): void {
        this.store.zoneSelection.set(null);
    }

    clearFocus(): void {
        this.store.focusVolunteerId.set(null);
    }
}
