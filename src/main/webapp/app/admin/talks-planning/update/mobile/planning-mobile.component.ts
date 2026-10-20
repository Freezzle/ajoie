import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {GridRoom, PlaceEvent, PlanningGridComponent, SlotEvent} from '../desktop/planning-grid.component';
import {hhmm, Talk, TimelineData, TimelineDay} from '../talks-planning-model';

export interface RoomPill {
    room: GridRoom;
    /** Première heure libre pour l'intervention en main, `null` si la salle est complète. */
    firstFree: number | null;
}

/** Vue mobile : une salle à la fois, grille pleine largeur (§7). */
@Component({
               selector: 'planning-mobile',
               standalone: true,
               imports: [PlanningGridComponent, TranslatePipe],
               templateUrl: './planning-mobile.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningMobileComponent {
    readonly configuration = input.required<TimelineData>();
    readonly day = input.required<TimelineDay>();
    readonly pills = input.required<RoomPill[]>();
    readonly selectedRoomId = input<string | null>(null);
    readonly talks = input.required<Talk[]>();
    readonly isEditing = input<boolean>(false);
    readonly talkInHand = input<string | null>(null);
    readonly selectedSlot = input<SlotEvent | null>(null);
    readonly focusTherapist = input<string | null>(null);
    readonly conflictTitles = input<Map<string, string>>(new Map());

    readonly roomSelected = output<string>();
    readonly slotClick = output<SlotEvent>();
    readonly talkClick = output<string>();
    readonly placeRequest = output<PlaceEvent>();
    readonly unplaceRequest = output<string>();

    readonly visibleRooms = computed<GridRoom[]>(() => {
        const current = this.pills().find(pill => pill.room.room.id === this.selectedRoomId());
        const fallback = this.pills()[0];
        const entry = current ?? fallback;
        return entry ? [entry.room] : [];
    });

    pillLabel(pill: RoomPill): string {
        if (!this.talkInHand()) {
            return '';
        }
        return pill.firstFree === null ? '' : hhmm(pill.firstFree);
    }

    isFull(pill: RoomPill): boolean {
        return this.talkInHand() !== null && pill.firstFree === null;
    }
}
