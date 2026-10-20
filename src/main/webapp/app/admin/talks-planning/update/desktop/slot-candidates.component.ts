import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {hhmm, Talk, talkKey} from '../talks-planning-model';
import {SlotCandidates} from '../talks-planning-utils';

/** Contenu du créneau choisi (§5.4). Utilisé dans le panneau desktop et dans le tiroir mobile. */
@Component({
               selector: 'slot-candidates',
               standalone: true,
               imports: [TranslatePipe],
               templateUrl: './slot-candidates.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SlotCandidatesComponent {
    readonly candidates = input.required<SlotCandidates>();
    readonly startMinute = input.required<number>();
    readonly isEditing = input<boolean>(false);

    readonly placeRequested = output<string>();
    readonly removeRequested = output<string>();
    readonly talkOpened = output<string>();

    private readonly translate = inject(TranslateService);

    readonly timeLabel = computed(() => hhmm(this.startMinute()));

    readonly isEmpty = computed(() => {
        const c = this.candidates();
        return c.here.length === 0 && c.free.length === 0 && c.move.length === 0;
    });

    keyOf(talk: Talk): string {
        return talkKey(talk);
    }

    subtitle(talk: Talk): string {
        return `${talk.participation.therapistName} · ${talk.durationTalkMinutes} ${this.translate.instant('planningTalks.details.minutes')}`;
    }

    position(talk: Talk): string {
        return talk.startMinute === null ? '' : hhmm(talk.startMinute);
    }
}
