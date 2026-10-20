import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {Talk, TimelineDay} from '../talks-planning-model';

export interface ConflictLine {
    key: string;
    title: string;
    position: string;
    reason: string;
}

/** Onglets de jours, ligne de statut et liste dépliable des conflits. */
@Component({
               selector: 'planning-day-bar',
               standalone: true,
               imports: [TranslatePipe],
               templateUrl: './planning-day-bar.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningDayBarComponent {
    readonly days = input.required<TimelineDay[]>();
    readonly selectedDayId = input<string | null>(null);
    readonly conflictsByDay = input<Map<string, number>>(new Map());
    readonly unplacedCount = input<number>(0);
    readonly conflicts = input<Talk[]>([]);
    readonly conflictLines = input<ConflictLine[]>([]);
    readonly expanded = input<boolean>(false);

    readonly daySelected = output<string>();
    readonly conflictsToggled = output<void>();
    readonly conflictSelected = output<string>();

    readonly conflictCount = computed(() => this.conflicts().length);

    hasConflict(dayId: string): boolean {
        return (this.conflictsByDay().get(dayId) ?? 0) > 0;
    }
}
