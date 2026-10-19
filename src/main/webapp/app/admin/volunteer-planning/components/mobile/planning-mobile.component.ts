import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {BottomSheetComponent} from './bottom-sheet.component';
import {MobilePersonGridComponent} from './mobile-person-grid.component';
import {MobileZoneListComponent} from './mobile-zone-list.component';
import {PersonPlanningSheetComponent} from './person-planning-sheet.component';
import {MinimumsSheetComponent} from './minimums-sheet.component';
import {ZoneAssignPanelComponent} from '../linked-view/zone-assign-panel.component';
import {VolunteerPlanningStore} from '../volunteer-planning.store';

type SheetKind = 'person' | 'minimums' | 'assign' | 'roster' | null;

@Component({
               selector: 'planning-mobile',
               standalone: true,
               imports: [
                   BottomSheetComponent,
                   MobilePersonGridComponent,
                   MobileZoneListComponent,
                   PersonPlanningSheetComponent,
                   MinimumsSheetComponent,
                   ZoneAssignPanelComponent,
                   TranslatePipe
               ],
               templateUrl: './planning-mobile.component.html',
               styleUrls: ['./planning-mobile.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningMobileComponent {
    readonly store = inject(VolunteerPlanningStore);

    readonly sheet = signal<SheetKind>(null);
    readonly personSheetId = signal<string>('');

    readonly isZoneView = computed(() => this.store.mobileView() === 'zone');

    setView(view: 'person' | 'zone'): void {
        this.store.mobileView.set(view);
        this.sheet.set(null);
    }

    openPerson(volunteerId: string): void {
        this.personSheetId.set(volunteerId);
        this.store.focusVolunteerId.set(volunteerId);
        this.sheet.set('person');
    }

    closeSheet(): void {
        this.sheet.set(null);
    }

    goToZones(volunteerId: string): void {
        this.store.mobileView.set('zone');
        this.store.focusVolunteerId.set(volunteerId);
        this.sheet.set(null);
    }
}
