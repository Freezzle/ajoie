import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {Tab, TabList, Tabs} from 'primeng/tabs';

import {TimelineDay} from '../talks-planning-model';

/** Onglets de jours du planning, avec leur nombre de conflits. */
@Component({
               selector: 'planning-day-bar',
               standalone: true,
               imports: [Tabs, TabList, Tab],
               templateUrl: './planning-day-bar.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningDayBarComponent {
    readonly days = input.required<TimelineDay[]>();
    readonly selectedDayId = input<string | null>(null);
    readonly conflictsByDay = input<Map<string, number>>(new Map());

    readonly daySelected = output<string>();

    hasConflict(dayId: string): boolean {
        return (this.conflictsByDay().get(dayId) ?? 0) > 0;
    }
}
