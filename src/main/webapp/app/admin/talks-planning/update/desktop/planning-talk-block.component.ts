import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

import StatusPipe from '../../../../shared/pipe/status.pipe';
import ColorStatusPipe from '../../../../shared/pipe/color-status.pipe';
import {hhmm, isUnsettledStatus, statusLabelKey, Talk} from '../talks-planning-model';

/**
 * Bloc d'intervention : bande de préparation, corps, bande de rangement.
 * Le positionnement vertical est assuré par la grille, le bloc ne connaît que ses hauteurs.
 */
@Component({
               selector: 'planning-talk-block',
               standalone: true,
               imports: [TranslatePipe, FaIconComponent, StatusPipe, ColorStatusPipe],
               template: `
                   <div class="tp-prep small" [style.height.px]="prepHeight()">
                       @if (prepHeight() >= 14) {
                           <span>{{ 'planningTalks.block.preparation' | translate }}</span>
                       }
                   </div>
                   <div class="tp-core small">
                       <div class="d-flex align-items-center gap-1 fw-bold">
                           <span>{{ timeLabel() }}</span>
                           @if (hasConflict()) {
                               <i class="pi pi-exclamation-triangle text-danger" [title]="conflictTitle()"></i>
                           }
                           @if (showStatus()) {
                               <span class="ms-auto">
                                   <fa-icon [class]="talk().status | colorStatus"
                                            [icon]="talk().status | status"
                                            [title]="statusKey() | translate"/>
                               </span>
                           }
                       </div>
                       <div class="tp-title lh-sm">{{ talk().title }}</div>
                       <div class="text-muted text-truncate">{{ talk().participation.therapistName }}</div>
                   </div>
                   <div class="tp-clean small" [style.height.px]="cleanHeight()">
                       @if (cleanHeight() >= 14) {
                           <span>{{ 'planningTalks.block.cleanup' | translate }}</span>
                       }
                   </div>
               `,
               styleUrl: './planning-talk-block.component.scss',
               host: {
                   'class': 'tp-block',
                   '[class.is-conference]': 'talk().type === "CONFERENCE"',
                   '[class.is-workshop]': 'talk().type === "WORKSHOP"',
                   '[class.has-conflict]': 'hasConflict()',
                   '[class.is-dimmed]': 'dimmed()',
                   '[class.is-highlighted]': 'highlighted()',
                   '[class.is-draggable]': 'draggable()'
               },
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningTalkBlockComponent {
    readonly talk = input.required<Talk>();
    readonly pxPerMinute = input.required<number>();
    readonly conflictTitle = input<string>('');
    readonly dimmed = input<boolean>(false);
    readonly highlighted = input<boolean>(false);
    readonly draggable = input<boolean>(false);

    readonly blockClick = output<void>();

    readonly hasConflict = computed(() => this.conflictTitle().length > 0);
    readonly prepHeight = computed(() => this.talk().preparationMinutes * this.pxPerMinute());
    readonly cleanHeight = computed(() => this.talk().cleanupMinutes * this.pxPerMinute());

    readonly timeLabel = computed(() => {
        const talk = this.talk();
        const start = talk.startMinute ?? 0;
        return `${hhmm(start)} – ${hhmm(start + talk.durationTalkMinutes)}`;
    });

    /** Un statut qui n'est pas abouti est signalé à droite de la ligne des heures. */
    readonly showStatus = computed(() => isUnsettledStatus(this.talk().status));

    readonly statusKey = computed(() => statusLabelKey(this.talk()));
}
