import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import {FormsModule} from '@angular/forms';
import {TaskInstanceService} from '../service/task-instance.service';
import {IFlatSubtask, ISubtaskInstance, ITaskInstance} from '../model/task-instance.interface';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {TaskInstanceFormComponent} from '../dialog/task-instance-form.component';
import {finalize} from 'rxjs/operators';
import {TaskCardComponent} from '../detail/task-card.component';
import {SubtaskFlatRowComponent} from '../detail/subtask-flat-row.component';
import {ProgressBar} from 'primeng/progressbar';
import {ToggleSwitch} from 'primeng/toggleswitch';

export type TaskFilter = 'all' | 'active' | 'late' | 'today' | 'in_progress' | 'done' | 'snoozed';

@Component({
    selector: 'app-task-focus-list',
    templateUrl: './task-focus-list.component.html',
    styleUrls: ['./task-focus-list.component.scss'],
    imports: [
        RouterModule,
        FormsModule,
        SharedModule,
        ContentPageComponent,
        CardComponent,
        ButtonBoxComponent,
        DialogBoxComponent,
        TaskInstanceFormComponent,
        TaskCardComponent,
        SubtaskFlatRowComponent,
        ProgressBar,
        ToggleSwitch
    ]
})
export class TaskFocusListComponent implements OnInit {
    protected activatedRoute = inject(ActivatedRoute);
    protected taskInstanceService = inject(TaskInstanceService);

    salonId: string = '';
    isLoading = false;
    tasks: ITaskInstance[] = [];
    activeFilter: TaskFilter = 'active';

    /** Bascule entre la vue cards (false) et la vue sous-tâches à plat (true) */
    flatView = signal(false);
    /** Proxy booléen pour [(ngModel)] du p-toggleswitch */
    get flatViewBool(): boolean { return this.flatView(); }
    set flatViewBool(v: boolean) { this.flatView.set(v); }

    // Dialog ajout/édition tâche
    showTaskDialog = signal(false);
    editingTask: ITaskInstance | null = null;

    ngOnInit(): void {
        this.salonId = this.activatedRoute.snapshot.paramMap.get('idSalon') ?? '';
        this.load();
    }

    load(): void {
        if (!this.salonId) return;
        this.isLoading = true;
        this.taskInstanceService.findAllBySalon(this.salonId)
            .pipe(finalize(() => (this.isLoading = false)))
            .subscribe(tasks => {
                this.tasks = tasks.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return a.sortOrder - b.sortOrder;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    const cmp = a.dueDate.localeCompare(b.dueDate);
                    return cmp !== 0 ? cmp : a.sortOrder - b.sortOrder;
                });
            });
    }

    // ── Dialog : ouvrir pour créer ──────────────────────────────────────────
    openAddTaskDialog(): void {
        this.editingTask = null;
        this.showTaskDialog.set(true);
    }

    // ── Dialog : ouvrir pour éditer ─────────────────────────────────────────
    openEditTaskDialog(task: ITaskInstance): void {
        this.editingTask = task;
        this.showTaskDialog.set(true);
    }

    // ── Dialog : confirmer ──────────────────────────────────────────────────
    onTaskDialogConfirm(draft: any): void {
        if (!draft) return;
        if (this.editingTask) {
            // Mode édition → PATCH
            this.taskInstanceService.patch(this.editingTask.id, draft).subscribe(() => this.load());
        } else {
            // Mode création → POST
            this.taskInstanceService.create(this.salonId, draft).subscribe(() => this.load());
        }
    }

    onTaskDialogCancel(): void {
        this.editingTask = null;
    }

    // ── Helpers date ────────────────────────────────────────────────────────
    private isSnoozed(t: ITaskInstance): boolean {
        const today = this.todayStr();
        return (t.subtasks ?? []).some(s => !!s.snoozedUntil && s.snoozedUntil >= today);
    }

    private hasActiveSubtask(t: ITaskInstance): boolean {
        return (t.subtasks ?? []).some(s => s.status !== 'DONE' && s.status !== 'CANCELLED');
    }

    private hasInProgressSubtask(t: ITaskInstance): boolean {
        return (t.subtasks ?? []).some(s => s.status === 'IN_PROGRESS');
    }

    private hasDoneSubtask(t: ITaskInstance): boolean {
        return (t.subtasks ?? []).some(s => s.status === 'DONE');
    }

    private todayStr(): string {
        return new Date().toISOString().split('T')[0];
    }

    // ── Sous-tâches à plat (hors tâches annulées) ──────────────────────────
    private get allSubtasks(): ISubtaskInstance[] {
        return this.tasks
            .filter(t => t.status !== 'CANCELLED')
            .flatMap(t => t.subtasks ?? []);
    }

    private isSubtaskLate(s: ISubtaskInstance): boolean {
        if (!s.dueDate || s.status === 'DONE' || s.status === 'CANCELLED' || this.isSubtaskSnoozed(s)) return false;
        return s.dueDate < this.todayStr();
    }

    private isSubtaskToday(s: ISubtaskInstance): boolean {
        if (!s.dueDate || s.status === 'DONE' || s.status === 'CANCELLED') return false;
        return s.dueDate === this.todayStr();
    }

    private isSubtaskSnoozed(s: ISubtaskInstance): boolean {
        const today = this.todayStr();
        return !!s.snoozedUntil && s.snoozedUntil >= today;
    }

    // ── Compteurs pour les badges de filtre ─────────────────────────────────
    get countAll(): number       { return this.allSubtasks.length; }
    get countActive(): number     { return this.allSubtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED').length; }
    get countLate(): number       { return this.allSubtasks.filter(s => this.isSubtaskLate(s)).length; }
    get countToday(): number      { return this.allSubtasks.filter(s => this.isSubtaskToday(s)).length; }
    get countInProgress(): number { return this.allSubtasks.filter(s => s.status === 'IN_PROGRESS').length; }
    get countDone(): number       { return this.allSubtasks.filter(s => s.status === 'DONE').length; }
    get countSnoozed(): number    { return this.allSubtasks.filter(s => this.isSubtaskSnoozed(s)).length; }

    // ── Progression globale ─────────────────────────────────────────────────
    get globalProgress(): number {
        if (this.countAll === 0) return 0;
        return Math.round((this.countDone / this.countAll) * 100);
    }

    // ── Filtre appliqué ─────────────────────────────────────────────────────
    get filteredTasks(): ITaskInstance[] {
        switch (this.activeFilter) {
            case 'active':      return this.tasks.filter(t => t.status !== 'CANCELLED' && this.hasActiveSubtask(t));
            case 'late':        return this.tasks.filter(t => (t.subtasks ?? []).some(s => this.isSubtaskLate(s)));
            case 'today':       return this.tasks.filter(t => (t.subtasks ?? []).some(s => this.isSubtaskToday(s)));
            case 'in_progress': return this.tasks.filter(t => this.hasInProgressSubtask(t));
            case 'done':        return this.tasks.filter(t => this.hasDoneSubtask(t));
            case 'snoozed':     return this.tasks.filter(t => this.isSnoozed(t));
            default:            return this.tasks;
        }
    }

    // ── Sous-tâches à plat triées par date (vue flat) ───────────────────────
    get flatSubtasks(): IFlatSubtask[] {
        const enriched: IFlatSubtask[] = this.tasks
            .filter(t => t.status !== 'CANCELLED')
            .flatMap(t =>
                (t.subtasks ?? []).map(s => ({...s, parentTask: t}))
            );

        const filtered = this.applySubtaskFilter(enriched);

        // Tri : ordre croissant — date la plus proche en premier, la plus lointaine en dernier
        // Les sous-tâches sans date vont tout en bas
        return filtered.sort((a, b) => {
            const da = a.dueDate;
            const db = b.dueDate;
            if (!da && !db) return 0;
            if (!da) return 1;   // sans date → fin
            if (!db) return -1;  // sans date → fin
            return da.localeCompare(db); // croissant : plus proche d'abord
        });
    }

    private applySubtaskFilter(subtasks: IFlatSubtask[]): IFlatSubtask[] {
        switch (this.activeFilter) {
            case 'active':
                return subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED');
            case 'late':
                return subtasks.filter(s => this.isSubtaskLate(s));
            case 'today':
                return subtasks.filter(s => this.isSubtaskToday(s));
            case 'in_progress':
                return subtasks.filter(s => s.status === 'IN_PROGRESS');
            case 'done':
                return subtasks.filter(s => s.status === 'DONE');
            case 'snoozed':
                return subtasks.filter(s => this.isSubtaskSnoozed(s));
            default:
                return subtasks;
        }
    }

    previousState(): void {
        window.history.back();
    }
}
