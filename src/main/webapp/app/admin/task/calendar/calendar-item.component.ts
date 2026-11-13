import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, viewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {IFlatSubtask, ISubtaskInstance} from '../model/task-instance.interface';
import {SubtaskEditRequest} from './calendar-quick-add.component';
import {ResponsibleAvatarComponent} from '../shared/responsible-avatar.component';
import {SubtaskStatusPanelComponent} from '../shared/subtask-status-panel.component';
import {daysLeft, effectiveDue, formatShortDate, isActive, isMoved} from '../shared/task-urgency.utils';

/**
 * Sous-tâche compacte du calendrier : pastille de statut, titre, tâche parente et
 * avatar. Un seul indicateur de statut, la pastille, qui ouvre le panneau radio ;
 * le clic sur le titre ouvre aussi ce panneau. Source du glisser-déposer.
 */
@Component({
               selector: 'app-calendar-item',
               imports: [SharedModule, ResponsibleAvatarComponent, SubtaskStatusPanelComponent],
               templateUrl: './calendar-item.component.html',
               styleUrl: './calendar-item.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class CalendarItemComponent {
    readonly subtask = input.required<IFlatSubtask>();
    readonly known = input<string[]>([]);
    /** Préfixe la tâche parente par le retard (bande « En retard »). */
    readonly showDelay = input<boolean>(false);
    /** Met l'élément brièvement en évidence après une action. */
    readonly flashed = input<boolean>(false);

    readonly changed = output<ISubtaskInstance>();
    /** Demande d'édition : la sous-tâche et l'élément auquel ancrer la popin. */
    readonly editRequested = output<SubtaskEditRequest>();

    private readonly translateService = inject(TranslateService);
    private readonly panel = viewChild(SubtaskStatusPanelComponent);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

    readonly done = computed(() => !isActive(this.subtask()));

    readonly movedHint = computed(() => {
        const subtask = this.subtask();
        if (!isMoved(subtask)) {
            return null;
        }

        return this.translateService.instant('task.calendar.movedTitle', {
            from: formatShortDate(subtask.dueDate),
            to: formatShortDate(effectiveDue(subtask))
        }) as string;
    });

    readonly delayLabel = computed(() => {
        const days = daysLeft(this.subtask());
        if (days === null || days >= 0) {
            return null;
        }

        return this.translateService.instant('task.due.late', {n: -days}) as string;
    });

    openPanel(event: Event): void {
        this.panel()?.openExternally(event);
    }

    /** Relaie la demande d'édition en y joignant l'ancre de la popin. */
    requestEdit(): void {
        this.editRequested.emit({subtask: this.subtask(), element: this.host.nativeElement});
    }
}
