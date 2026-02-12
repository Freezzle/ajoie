import {Component, computed, input, model} from '@angular/core';
import {Badge} from 'primeng/badge';
import {Status} from '../../../admin/enumerations/status.model';

@Component({
               selector: 'talk-slot',
               imports: [
                   Badge
               ],
               templateUrl: './talk-slot.component.html',
               styleUrl: './talk-slot.component.scss'
           })
export class TalkSlotComponent {
    widthInPx = input<number>(60);
    talk = model.required<Talk>();
    conferenceType = computed(() => this.talk().type === 'CONFERENCE');
}

export interface Talk {
    id: string;
    type: 'WORKSHOP' | 'CONFERENCE';
    client: string;
    title: string;
    description: string;
    durationTotalMinutes: number;
    durationTalkMinutes: number;
    roomId: string | null;
    dayId: string | null,
    startSlot: number;
    status: Status;
    extraInformation: string | null;
    participation: {
        therapistName: string;
        fullName: string | null;
    };
}