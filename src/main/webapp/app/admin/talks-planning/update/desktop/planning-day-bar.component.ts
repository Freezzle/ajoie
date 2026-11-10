import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {Tab, TabList, Tabs} from 'primeng/tabs';

import {ButtonBoxComponent} from '../../../../shared/components/button-box/button-box.component';
import {MenuBoxComponent} from '../../../../shared/components/menu-box/menu-box.component';
import {AppMenuItem} from '../../../../shared/utils/app-menu-item.model';
import {TimelineDay} from '../talks-planning-model';

/** Onglets de jours et actions contextuelles du planning (téléchargements, configuration, annulation). */
@Component({
               selector: 'planning-day-bar',
               standalone: true,
               imports: [Tabs, TabList, Tab, ButtonBoxComponent, MenuBoxComponent],
               templateUrl: './planning-day-bar.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningDayBarComponent {
    readonly days = input.required<TimelineDay[]>();
    readonly selectedDayId = input<string | null>(null);
    readonly conflictsByDay = input<Map<string, number>>(new Map());
    readonly isReadOnly = input<boolean>(true);
    readonly isLoading = input<boolean>(false);
    readonly canUndo = input<boolean>(false);
    readonly menuItems = input<AppMenuItem[]>([]);

    readonly daySelected = output<string>();
    readonly configRequested = output<void>();
    readonly undoRequested = output<void>();

    hasConflict(dayId: string): boolean {
        return (this.conflictsByDay().get(dayId) ?? 0) > 0;
    }
}
