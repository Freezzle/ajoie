import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {Select} from 'primeng/select';

import StatusPipe from '../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {hhmm, isPlaced, statusLabelKey, Talk, TimelineData} from './talks-planning-model';
import {ConflictReason, findRoomLabel} from './talks-planning-utils';

export interface StartOption {
    minute: number;
    label: string;
}

/** Détail d'une intervention (§5.6). Panneau latéral en desktop, tiroir bas en mobile. */
@Component({
               selector: 'talk-detail-panel',
               standalone: true,
               imports: [
                   FormsModule,
                   TranslatePipe,
                   FaIconComponent,
                   StatusPipe,
                   ColorStatusPipe,
                   Select,
                   ButtonBoxComponent
               ],
               templateUrl: './talk-detail-panel.component.html',
               styleUrl: './talk-detail-panel.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TalkDetailPanelComponent {
    readonly talk = input.required<Talk>();
    readonly configuration = input.required<TimelineData>();
    readonly isEditing = input<boolean>(false);
    readonly reasons = input<ConflictReason[]>([]);
    readonly startOptions = input<StartOption[]>([]);

    readonly closed = output<void>();
    readonly dayChanged = output<string>();
    readonly roomChanged = output<string>();
    readonly startChanged = output<number>();
    readonly chooseOnGrid = output<void>();
    readonly removeRequested = output<void>();
    readonly therapistFocused = output<string>();

    private readonly translate = inject(TranslateService);

    readonly placed = computed(() => isPlaced(this.talk()));

    readonly placementLabel = computed(() => {
        const talk = this.talk();
        if (!isPlaced(talk)) {
            return this.translateText('planningTalks.tray.title');
        }
        const config = this.configuration();
        const day = config.days.find(entry => entry.id === talk.dayId);
        return `${day?.label ?? ''} · ${findRoomLabel(config, talk.roomId)} · ${hhmm(talk.startMinute!)}`;
    });

    readonly durationLabel = computed(() => {
        const talk = this.talk();
        return this.translateText('planningTalks.durations.long', {
            prep: talk.preparationMinutes,
            dur: talk.durationTalkMinutes,
            clean: talk.cleanupMinutes
        });
    });

    readonly barParts = computed(() => {
        const talk = this.talk();
        const total = Math.max(1, talk.durationTotalMinutes);
        return {
            prep: (talk.preparationMinutes / total) * 100,
            talk: (talk.durationTalkMinutes / total) * 100,
            clean: (talk.cleanupMinutes / total) * 100
        };
    });

    readonly dayOptions = computed(() =>
                                       this.configuration().days.map(day => ({label: day.label, value: day.id})));

    readonly roomOptions = computed(() => {
        const config = this.configuration();
        const day = config.days.find(entry => entry.id === this.talk().dayId);
        return config.rooms.map(room => ({
            label: room.label,
            value: room.id,
            disabled: !day?.rooms.some(data => data.roomId === room.id)
        }));
    });

    readonly typeKey = computed(() =>
                                    this.talk().type === 'CONFERENCE'
                                    ? 'planningTalks.details.conference'
                                    : 'planningTalks.details.workshop');

    readonly statusKey = computed(() => statusLabelKey(this.talk()));

    private translateText(key: string, params?: Record<string, string | number>): string {
        return String(this.translate.instant(key, params));
    }
}
