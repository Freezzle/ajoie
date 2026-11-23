import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';

import {AppTab, TabBodyDirective, TabsComponent} from '../../../../shared/components/tabs';
import {TimelineDay} from '../talks-planning-model';

/** Onglets de jours du planning, avec leur nombre de conflits. */
@Component({
               selector: 'planning-day-bar',
               standalone: true,
               imports: [TabsComponent, TabBodyDirective],
               templateUrl: './planning-day-bar.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningDayBarComponent {
    readonly days = input.required<TimelineDay[]>();
    readonly selectedDayId = input<string | null>(null);
    readonly conflictsByDay = input<Map<string, number>>(new Map());

    readonly daySelected = output<string>();

    readonly dayTabs = computed<AppTab[]>(() => this.days().map(day => {
        const conflicts = this.conflictsByDay().get(day.id) ?? 0;

        return {
            key: day.id,
            label: day.label,
            badge: conflicts > 0 ? {type: 'danger', value: conflicts} : null
        };
    }));
}
