import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

import StatusPipe from '../../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../../shared/pipe/color-status.pipe';
import {isUnsettledStatus, statusLabelKey, Talk} from '../talks-planning-model';
import {TrayFilter} from '../talks-planning.store';

/** Bac « À planifier » : filtres, recherche et cartes. Réutilisé dans le tiroir mobile. */
@Component({
               selector: 'talk-tray',
               standalone: true,
               imports: [FormsModule, TranslatePipe, FaIconComponent, StatusPipe, ColorStatusPipe],
               templateUrl: './talk-tray.component.html',
               styleUrl: './talk-tray.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TalkTrayComponent {
    readonly talks = input.required<Talk[]>();
    readonly counts = input.required<{ ALL: number; CONFERENCE: number; WORKSHOP: number }>();
    readonly filter = input.required<TrayFilter>();
    readonly query = input<string>('');
    readonly isEditing = input<boolean>(false);
    readonly inHandKey = input<string | null>(null);
    readonly totalCount = input<number>(0);

    readonly filterChanged = output<TrayFilter>();
    readonly queryChanged = output<string>();
    readonly talkChosen = output<Talk>();
    readonly talkDragStart = output<{ talk: Talk; event: PointerEvent }>();

    readonly filters: { value: TrayFilter; key: string }[] = [
        {value: 'ALL', key: 'planningTalks.tray.all'},
        {value: 'CONFERENCE', key: 'planningTalks.tray.conferences'},
        {value: 'WORKSHOP', key: 'planningTalks.tray.workshops'}
    ];

    countOf(filter: TrayFilter): number {
        return this.counts()[filter];
    }

    /** Les statuts « aboutis » ne sont pas affichés : seuls les autres méritent d'être signalés. */
    showStatus(talk: Talk): boolean {
        return isUnsettledStatus(talk.status);
    }

    statusKey(talk: Talk): string {
        return statusLabelKey(talk);
    }

    talkKeyOf(talk: Talk): string {
        return `${talk.type}:${talk.id}`;
    }
}
