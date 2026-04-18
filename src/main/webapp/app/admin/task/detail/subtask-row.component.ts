import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ISubtaskInstance} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import DaysRelativePipe from '../../../shared/date/days-relative.pipe';
import FormatMediumDatePipe from '../../../shared/date/format-medium-date.pipe';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {Tag} from 'primeng/tag';
import {Checkbox} from 'primeng/checkbox';
import {Popover} from 'primeng/popover';

@Component({
    selector: 'app-subtask-row',
    templateUrl: './subtask-row.component.html',
    styleUrls: ['./subtask-row.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        MenuBoxComponent,
        DaysRelativePipe,
        FormatMediumDatePipe,
        TimeSincePipe,
        Tag,
        Checkbox,
        Popover
    ]
})
export class SubtaskRowComponent {
    @Input() subtask!: ISubtaskInstance;
    @Output() changed = new EventEmitter<{id: string; status: string}>();
    @Output() editRequested = new EventEmitter<void>();

    protected taskInstanceService = inject(TaskInstanceService);
    private translateService = inject(TranslateService);

    get isDone(): boolean {
        return this.subtask.status === 'DONE';
    }

    /** Vrai si la sous-tâche est snoozée (date de snooze dans le futur) et non terminée. */
    get isSnoozed(): boolean {
        return !(this.isDone || !this.subtask.snoozedUntil);

    }

    /** Date à afficher : snooze si actif, sinon dueDate. */
    get displayDate(): string | null {
        return this.isSnoozed ? this.subtask.snoozedUntil : this.subtask.dueDate;
    }

    get dateStatus(): 'late' | 'soon' | 'today' | 'ok' | null {
        const dueDate = this.displayDate;
        const status = this.subtask.status;
        if (!dueDate || status === 'DONE' || status === 'CANCELLED' || status === 'BLOCKED') return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate + 'T00:00:00');
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
        if (diffDays < 0) return 'late';
        if (diffDays === 0) return 'today';
        if (diffDays <= 7) return 'soon';
        return 'ok';
    }

    get dateSeverity(): 'danger' | 'warn' | 'info' | 'secondary' {
        switch (this.dateStatus) {
            case 'late':  return 'danger';
            case 'today': return 'warn';
            case 'soon':  return 'info';
            default:      return 'secondary';
        }
    }

    get statusSeverity(): 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (this.subtask.status) {
            case 'DONE':        return 'success';
            case 'IN_PROGRESS': return 'warn';
            case 'BLOCKED':     return 'danger';
            case 'CANCELLED':   return 'secondary';
            default:            return 'contrast';
        }
    }

    toggleDone(): void {
        const newStatus = this.isDone ? 'PENDING' : 'DONE';
        this.taskInstanceService.updateSubtaskStatus(this.subtask.id, newStatus)
            .subscribe(() => this.changed.emit({id: this.subtask.id, status: newStatus}));
    }

    get menuItems(): AppMenuItem[] {
        return [
            {
                label: this.translateService.instant('task.menu.editSubtask') as string,
                icon: 'pi pi-pencil',
                command: () => this.editRequested.emit()
            },
            {separator: true},
            {
                label: this.translateService.instant('task.menu.markInProgress') as string,
                icon: 'pi pi-play',
                disabled: this.subtask.status === 'IN_PROGRESS',
                command: () => this.taskInstanceService.updateSubtaskStatus(this.subtask.id, 'IN_PROGRESS')
                    .subscribe(() => this.changed.emit({id: this.subtask.id, status: 'IN_PROGRESS'}))
            },
            {
                label: this.translateService.instant('task.menu.markPending') as string,
                icon: 'pi pi-pause',
                disabled: this.subtask.status === 'PENDING',
                command: () => this.taskInstanceService.updateSubtaskStatus(this.subtask.id, 'PENDING')
                    .subscribe(() => this.changed.emit({id: this.subtask.id, status: 'PENDING'}))
            },
            {
                label: this.translateService.instant('task.menu.markBlocked') as string,
                icon: 'pi pi-ban',
                disabled: this.subtask.status === 'BLOCKED',
                command: () => this.taskInstanceService.updateSubtaskStatus(this.subtask.id, 'BLOCKED')
                    .subscribe(() => this.changed.emit({id: this.subtask.id, status: 'BLOCKED'}))
            },
            {separator: true},
            {
                label: this.translateService.instant('task.menu.delete') as string,
                icon: 'pi pi-trash',
                styleClass: 'danger-item',
                command: () => this.taskInstanceService.deleteSubtask(this.subtask.id)
                    .subscribe(() => this.changed.emit({id: this.subtask.id, status: 'DELETED'}))
            }
        ];
    }
}
