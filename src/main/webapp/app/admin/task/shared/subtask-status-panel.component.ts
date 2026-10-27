import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    output,
    viewChild,
    ViewEncapsulation
} from '@angular/core';
import {MessageService} from 'primeng/api';
import {Popover} from 'primeng/popover';
import {TranslateService} from '@ngx-translate/core';

import SharedModule from '../../../shared/shared.module';
import {ISubtaskInstance, ITaskInstance, TaskStatus} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {StatusIconKey, SubtaskStatusIconComponent} from './subtask-status-icon.component';
import {
    daysLeft,
    effectiveDue,
    formatShortDate,
    isActive,
    isLate,
    isMoved,
    SELECTABLE_STATUSES,
    snoozeTarget
} from './task-urgency.utils';

/** Clé du toast global portant l'action « Annuler ». */
export const UNDO_TOAST_KEY = 'task-undo';

/** Reports proposés, en jours. */
const SNOOZE_STEPS = [1, 3, 7];

/**
 * Pastille de statut et panneau qu'elle ouvre : changement de statut, report de
 * l'échéance et attribution. Remplace à la fois la case à cocher, les libellés de
 * statut et le menu ⋯ des anciennes lignes.
 */
@Component({
               selector: 'subtask-status-panel',
               imports: [SharedModule, Popover, SubtaskStatusIconComponent],
               templateUrl: './subtask-status-panel.component.html',
               styleUrl: './subtask-status-panel.component.scss',
               encapsulation: ViewEncapsulation.None,
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SubtaskStatusPanelComponent {
    readonly subtask = input.required<ISubtaskInstance>();
    readonly task = input<ITaskInstance | null>(null);
    /** Responsables connus du salon, proposés dans la section « Attribuer à ». */
    readonly known = input<string[]>([]);

    /** Émis après toute modification enregistrée côté serveur. */
    readonly changed = output<ISubtaskInstance>();
    /** Émis par « Modifier… », pour ouvrir le formulaire complet. */
    readonly editRequested = output<void>();

    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly translateService = inject(TranslateService);
    private readonly messageService = inject(MessageService);
    private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

    readonly statuses = SELECTABLE_STATUSES;
    readonly steps = SNOOZE_STEPS;

    readonly iconKey = computed<StatusIconKey>(() => this.subtask().status);

    readonly active = computed(() => isActive(this.subtask()));

    readonly moved = computed(() => isMoved(this.subtask()));

    readonly dueLabel = computed(() => formatShortDate(effectiveDue(this.subtask())));

    readonly originalDueLabel = computed(() => formatShortDate(this.subtask().dueDate));

    readonly daysLabel = computed(() => {
        const days = daysLeft(this.subtask());
        if (days === null) {
            return this.text('task.due.none');
        }
        if (days < 0) {
            return this.text('task.due.late', {n: -days});
        }

        return days === 0 ? this.text('task.due.today') : this.text('task.due.in', {n: days});
    });

    readonly triggerLabel = computed(() => this.text('task.panel.changeStatus',
                                                     {status: this.text(`task.status.${this.subtask().status}`)}));

    readonly triggerHint = computed(() => {
        const label = this.text(`task.status.${this.subtask().status}`);

        return isLate(this.subtask()) ? `${label} · ${this.text('task.chip.late')}` : label;
    });

    open(popover: Popover, event: Event): void {
        event.stopPropagation();
        popover.toggle(event, this.trigger()?.nativeElement);
    }

    isCurrent(status: TaskStatus): boolean {
        return this.subtask().status === status;
    }

    statusLabel(status: TaskStatus): string {
        return this.text(`task.status.${status}`);
    }

    selectStatus(popover: Popover, status: TaskStatus): void {
        const previous = this.subtask().status;
        if (previous === status) {
            popover.hide();

            return;
        }

        this.taskInstanceService.updateSubtaskStatus(this.subtask().id, status).subscribe(updated => {
            popover.hide();
            this.changed.emit(updated);
            this.toast(this.text('task.panel.statusChanged', {status: this.statusLabel(status)}),
                       () => this.taskInstanceService.updateSubtaskStatus(updated.id, previous)
                                 .subscribe(reverted => this.changed.emit(reverted)));
        });
    }

    snooze(popover: Popover, days: number): void {
        const target = snoozeTarget(this.subtask(), days);

        this.patch(popover, {snoozeUntilType: 'FIXED', snoozedUntil: target, snoozeOffset: null},
                   this.text('task.panel.pushed', {label: formatShortDate(target)}));
    }

    restore(popover: Popover): void {
        this.patch(popover, {snoozeUntilType: null, snoozedUntil: null, snoozeOffset: null},
                   this.text('task.panel.restored'));
    }

    assign(popover: Popover, responsible: string | null): void {
        this.patch(popover, {responsible}, null);
    }

    isAssigned(responsible: string | null): boolean {
        return this.subtask().responsible === responsible;
    }

    edit(popover: Popover): void {
        popover.hide();
        this.editRequested.emit();
    }

    private patch(popover: Popover, data: Partial<ISubtaskInstance>, message: string | null): void {
        this.taskInstanceService.patchSubtask(this.subtask().id, data).subscribe(updated => {
            popover.hide();
            this.changed.emit(updated);

            if (message) {
                this.toast(message);
            }
        });
    }

    private toast(summary: string, undo?: () => void): void {
        this.messageService.add({
                                    key: UNDO_TOAST_KEY,
                                    severity: 'success',
                                    summary,
                                    life: 6000,
                                    data: undo ? {undo} : undefined
                                });
    }

    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}
