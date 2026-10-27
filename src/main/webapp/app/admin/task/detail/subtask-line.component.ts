import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {EntityHighlightComponent} from '../../../shared/components/entity-list/entity-highlight.component';
import {ISubtaskInstance, ITaskInstance} from '../model/task-instance.interface';
import {DueLabelComponent} from '../shared/due-label.component';
import {ResponsibleAvatarComponent} from '../shared/responsible-avatar.component';
import {SubtaskStatusPanelComponent} from '../shared/subtask-status-panel.component';
import {isActive} from '../shared/task-urgency.utils';

/**
 * Ligne de sous-tâche, utilisée telle quelle dans la vue à plat et dans les cartes.
 *
 * Un seul indicateur de statut : la pastille, qui ouvre le panneau. Le titre de la
 * sous-tâche est prioritaire : c'est la tâche parente qui rétrécit la première.
 */
@Component({
               selector: 'subtask-line',
               imports: [
                   SharedModule,
                   EntityHighlightComponent,
                   DueLabelComponent,
                   ResponsibleAvatarComponent,
                   SubtaskStatusPanelComponent
               ],
               templateUrl: './subtask-line.component.html',
               styleUrl: './subtask-line.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SubtaskLineComponent {
    readonly subtask = input.required<ISubtaskInstance>();
    /** Tâche parente : sert au responsable hérité et au lien « ouvrir la carte ». */
    readonly task = input<ITaskInstance | null>(null);
    readonly known = input<string[]>([]);
    readonly query = input<string>('');
    /** Affiche le nom de la tâche parente ; masqué dans les cartes. */
    readonly showTask = input<boolean>(false);
    /** Masqué quand la vue est groupée par responsable ; la colonne reste réservée. */
    readonly showAvatar = input<boolean>(true);

    readonly changed = output<ISubtaskInstance>();
    readonly editRequested = output<ISubtaskInstance>();
    readonly taskRequested = output<ITaskInstance>();

    private readonly translateService = inject(TranslateService);

    readonly done = computed(() => !isActive(this.subtask()));

    readonly taskHint = computed(() => {
        const title = this.task()?.title ?? '';

        return `${title} · ${this.translateService.instant('task.list.openTask') as string}`;
    });

    openTask(event: Event): void {
        event.stopPropagation();

        const task = this.task();
        if (task) {
            this.taskRequested.emit(task);
        }
    }
}
