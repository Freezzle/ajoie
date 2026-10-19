import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerAvatarComponent} from '../linked-view/volunteer-avatar.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';
import {formatHours, Run, slotTime} from '../volunteer-planning-utils';

type SheetItem = {
    kind: 'CATEGORY' | 'UNAVAILABLE' | 'FREE';
    label: string;
    icon: string;
    color: string | null;
    from: string;
    to: string;
    duration: string;
    start: number;
};

@Component({
               selector: 'person-planning-sheet',
               standalone: true,
               imports: [VolunteerAvatarComponent, TranslatePipe],
               templateUrl: './person-planning-sheet.component.html',
               styleUrls: ['./person-planning-sheet.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PersonPlanningSheetComponent {
    readonly store = inject(VolunteerPlanningStore);

    readonly volunteerId = input.required<string>();
    readonly closed = output<void>();
    readonly goToZones = output<string>();

    readonly volunteer = computed(() =>
        this.store.planning().volunteers.find(v => v.id === this.volunteerId()) ?? null
    );

    readonly hours = computed(() => formatHours(this.store.hoursByVolunteer().get(this.volunteerId()) ?? 0));

    readonly runs = computed<Run[]>(() => this.store.runsByVolunteer().get(this.volunteerId()) ?? []);

    readonly items = computed<SheetItem[]>(() => {
        const day = this.store.selectedDay();
        const runs = this.runs();
        if (!day || !runs.length) {
            return [];
        }
        const count = this.store.slotCount();
        const categoryMap = this.store.categoryMap();
        const out: SheetItem[] = [];
        let last = 0;

        const push = (kind: SheetItem['kind'], start: number, end: number, categoryId?: string) => {
            const category = categoryId ? categoryMap.get(categoryId) : undefined;
            out.push({
                         kind,
                         label: kind === 'CATEGORY' ? (category?.label ?? '') : '',
                         icon: kind === 'CATEGORY'
                             ? (category?.icon ?? 'pi pi-circle-fill')
                             : (kind === 'UNAVAILABLE' ? 'pi pi-ban' : 'pi pi-clock'),
                         color: kind === 'CATEGORY' ? (category?.color ?? null) : null,
                         from: slotTime(day, start),
                         to: slotTime(day, end),
                         duration: formatHours(((end - start) * day.intervalMinutes) / 60),
                         start
                     });
        };

        for (const run of runs) {
            if (run.start > last) {
                push('FREE', last, run.start);
            }
            push(run.kind, run.start, run.end, run.categoryId);
            last = run.end;
        }
        if (last < count) {
            push('FREE', last, count);
        }
        return out;
    });
}
