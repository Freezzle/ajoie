import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {Category} from '../volunteer-planning-model';
import {NAME_COLUMN_WIDTH, setNeed} from '../volunteer-planning-utils';

@Component({
               selector: 'coverage-rows',
               standalone: true,
               imports: [TranslatePipe],
               templateUrl: './coverage-rows.component.html',
               styleUrls: ['./coverage-rows.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class CoverageRowsComponent {
    readonly store = inject(VolunteerPlanningStore);

    readonly nameWidth = NAME_COLUMN_WIDTH;
    readonly slotW = this.store.slotW;
    readonly slotWCss = this.store.slotWCss;
    readonly trackWidth = this.store.trackWidth;
    readonly categories = computed<Category[]>(() => this.store.categories());

    cellsOf(categoryId: string) {
        return this.store.coverageMatrix().get(categoryId) ?? [];
    }

    cellLeft(slot: number): number {
        return slot * this.slotW() + 2;
    }

    cellWidth(): number {
        return this.slotW() - 4;
    }

    toggleEdit(): void {
        this.store.editMinimums.set(!this.store.editMinimums());
    }

    bumpNeed(categoryId: string, slot: number, delta: number): void {
        const current = this.store.getNeed(categoryId, slot);
        this.store.updateDay(day => setNeed(day, categoryId, slot, current + delta));
    }
}
