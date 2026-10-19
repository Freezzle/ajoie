import {ChangeDetectionStrategy, Component, computed, inject, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {setNeed} from '../volunteer-planning-utils';

@Component({
               selector: 'minimums-sheet',
               standalone: true,
               imports: [TranslatePipe],
               templateUrl: './minimums-sheet.component.html',
               styleUrls: ['./minimums-sheet.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class MinimumsSheetComponent {
    readonly store = inject(VolunteerPlanningStore);

    readonly closed = output<void>();

    readonly shortLabels = computed(() => this.store.timeSlots().map(slot => {
        const [h, m] = slot.label.split(':');
        return m === '00' ? `${Number(h)}h` : `:${m}`;
    }));

    readonly rows = computed(() => this.store.categories().map(category => ({
        category,
        cells: this.store.coverageMatrix().get(category.id) ?? []
    })));

    bumpNeed(categoryId: string, slot: number, delta: number): void {
        const current = this.store.getNeed(categoryId, slot);
        this.store.updateDay(day => setNeed(day, categoryId, slot, current + delta));
    }
}
