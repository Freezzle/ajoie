import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {PlanningTimelineComponent} from './planning-timeline.component';
import {PlanningZonesComponent} from './planning-zones.component';
import {CoverageRowsComponent} from './coverage-rows.component';
import {ZoneAssignPanelComponent} from './zone-assign-panel.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {slotTime} from '../volunteer-planning-utils';

@Component({
               selector: 'planning-linked-view',
               standalone: true,
               imports: [PlanningTimelineComponent, PlanningZonesComponent, CoverageRowsComponent, ZoneAssignPanelComponent, TranslatePipe],
               templateUrl: './planning-linked-view.component.html',
               styleUrls: ['./planning-linked-view.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningLinkedViewComponent {
    readonly store = inject(VolunteerPlanningStore);

    readonly slotW = this.store.slotW;
    readonly trackWidth = this.store.trackWidth;
    readonly totalWidth = this.store.totalWidth;

    readonly showPersons = computed(() => this.store.viewMode() !== 'zone');
    readonly showZones = computed(() => this.store.viewMode() !== 'person');

    readonly selectedToolCategoryId = computed(() => {
        const tool = this.store.tool();
        return tool.kind === 'CATEGORY' ? tool.categoryId : null;
    });

    readonly ticks = computed(() => {
        const day = this.store.selectedDay();
        if (!day) {
            return [];
        }
        const w = this.slotW();
        return this.store.timeSlots()
                   .filter(slot => !!slot.displayLabel)
                   .map(slot => ({left: slot.index * w, label: slot.displayLabel, index: slot.index}));
    });

    readonly selectedRangeLabel = computed(() => {
        const sel = this.store.zoneSelection();
        const day = this.store.selectedDay();
        if (!sel || !day) {
            return '';
        }
        return `${slotTime(day, sel.start)} → ${slotTime(day, sel.end + 1)}`;
    });

    readonly selectedCategory = computed(() => {
        const sel = this.store.zoneSelection();
        return sel ? (this.store.categoryMap().get(sel.categoryId) ?? null) : null;
    });

    selectTool(kind: 'ERASER' | 'UNAVAILABLE'): void {
        this.store.tool.set({kind});
    }

    selectCategory(categoryId: string, event: Event): void {
        this.store.tool.set({kind: 'CATEGORY', categoryId});
        (event.currentTarget as HTMLElement | null)?.blur();
    }

    clearSelection(): void {
        this.store.zoneSelection.set(null);
    }
}
