import {Component, EventEmitter, inject, Input, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {ISubtaskInstance, ITaskInstance} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {SubtaskRowComponent} from './subtask-row.component';
import DaysRemainingPipe from '../../../shared/date/days-remaining.pipe';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {SubtaskInstanceFormComponent} from '../dialog/subtask-instance-form.component';
import {Tag} from 'primeng/tag';
import {ProgressBar} from 'primeng/progressbar';
import DaysRelativePipe from '../../../shared/date/days-relative.pipe';
import {TaskFilter} from '../list/task-focus-list.component';

@Component({
    selector: 'app-task-card',
    templateUrl: './task-card.component.html',
    styleUrls: ['./task-card.component.scss'],
               imports: [
                   CommonModule,
                   FormsModule,
                   TranslateModule,
                   MenuBoxComponent,
                   ButtonBoxComponent,
                   SubtaskRowComponent,
                   TimeSincePipe,
                   DialogBoxComponent,
                   SubtaskInstanceFormComponent,
                   Tag,
                   ProgressBar,
                   DaysRelativePipe
               ]
           })
export class TaskCardComponent {
    @Input() task!: ITaskInstance;
    @Input() activeFilter: TaskFilter = 'active';
    @Output() statusChanged = new EventEmitter<void>();
    @Output() editRequested = new EventEmitter<void>();

    protected taskInstanceService = inject(TaskInstanceService);

    showSubtasks = false;
    showCommentInput = false;
    commentAuthor = '';
    commentBody = '';
    showComments = false;

    // Édition inline du responsable
    editingResponsible = false;
    editResponsibleValue = '';

    // Dialog sous-tâche (ajout / édition)
    showSubtaskDialog = signal(false);
    editingSubtask: ISubtaskInstance | null = null;


    get isDone(): boolean {
        return this.task.status === 'DONE';
    }

    get isCancelled(): boolean {
        return this.task.status === 'CANCELLED';
    }

    get doneSubtaskCount(): number {
        return (this.task.subtasks ?? []).filter(s => s.status === 'DONE').length;
    }

    get subtaskProgress(): number {
        const total = (this.task.subtasks ?? []).length;
        if (total === 0) return 0;
        return Math.round((this.doneSubtaskCount / total) * 100);
    }

    /** Sous-tâches filtrées selon le filtre actif, puis triées par dueDate (nulls en dernier) puis sortOrder */
    get sortedSubtasks() {
        const today = new Date().toISOString().split('T')[0];
        let subtasks = [...(this.task.subtasks ?? [])];

        switch (this.activeFilter) {
            case 'late':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED' && !!s.dueDate && s.dueDate < today);
                break;
            case 'today':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED' && s.dueDate === today);
                break;
            case 'in_progress':
                subtasks = subtasks.filter(s => s.status === 'IN_PROGRESS');
                break;
            case 'done':
                subtasks = subtasks.filter(s => s.status === 'DONE');
                break;
            case 'snoozed':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && !!s.snoozedUntil && s.snoozedUntil >= today);
                break;
            case 'active':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED');
                break;
            // 'all' et 'active' : toutes les sous-tâches
        }

        return subtasks.sort((a, b) => {
            if (!a.dueDate && !b.dueDate) return a.sortOrder - b.sortOrder;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            const cmp = a.dueDate.localeCompare(b.dueDate);
            return cmp !== 0 ? cmp : a.sortOrder - b.sortOrder;
        });
    }

    /** Commentaires triés du plus récent au plus ancien */
    get sortedComments() {
        return [...(this.task.comments ?? [])].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt)
        );
    }

    get dueDateStatus(): 'late' | 'soon' | 'today' | 'ok' | null {
        const dueDate = this.task.dueDate;
        const status = this.task.status;
        if (!dueDate || status === 'DONE' || status === 'CANCELLED') return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate + 'T00:00:00');
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
        if (diffDays < 0) return 'late';
        if (diffDays === 0) return 'today';
        if (diffDays <= 7) return 'soon';
        return 'ok';
    }

    get dueDateClass(): string {
        switch (this.dueDateStatus) {
            case 'late':  return 'due-late';
            case 'today': return 'due-today';
            case 'soon':  return 'due-soon';
            default:      return 'due-ok';
        }
    }

    get accentClass(): string {
        if (this.isDone || this.isCancelled) return 'tc--neutral';
        switch (this.dueDateStatus) {
            case 'late':  return 'tc--late';
            case 'today': return 'tc--today';
            case 'soon':  return 'tc--soon';
            default:      return 'tc--neutral';
        }
    }

    get dueDateSeverity(): 'danger' | 'warn' | 'info' | 'secondary' {
        switch (this.dueDateStatus) {
            case 'late':  return 'danger';
            case 'today': return 'warn';
            case 'soon':  return 'info';
            default:      return 'secondary';
        }
    }

    get taskStatusSeverity(): 'success' | 'warn' | 'secondary' | 'contrast' {
        switch (this.task.status) {
            case 'DONE':        return 'success';
            case 'IN_PROGRESS': return 'warn';
            case 'CANCELLED':   return 'secondary';
            default:            return 'contrast';
        }
    }

    get menuItems(): AppMenuItem[] {
        return [
            {
                label: 'Modifier la tâche',
                icon: 'pi pi-pencil',
                command: () => this.editRequested.emit()
            },
            {separator: true},
            {
                label: 'Marquer en cours',
                icon: 'pi pi-play',
                disabled: this.task.status === 'IN_PROGRESS',
                command: () => this.taskInstanceService.updateStatus(this.task.id, 'IN_PROGRESS')
                    .subscribe(() => this.statusChanged.emit())
            },
            {
                label: 'Marquer en attente',
                icon: 'pi pi-pause',
                disabled: this.task.status === 'PENDING',
                command: () => this.taskInstanceService.updateStatus(this.task.id, 'PENDING')
                    .subscribe(() => this.statusChanged.emit())
            },
            {separator: true},
            {
                label: 'Ajouter une sous-tâche',
                icon: 'pi pi-plus',
                command: () => this.openAddSubtaskDialog()
            },
            {
                label: 'Ajouter un commentaire',
                icon: 'pi pi-comment',
                command: () => { this.showCommentInput = true; }
            },
            {
                label: (this.task.comments ?? []).length > 0
                    ? `Voir les commentaires (${(this.task.comments ?? []).length})`
                    : 'Commentaires',
                icon: 'pi pi-inbox',
                disabled: (this.task.comments ?? []).length === 0,
                command: () => { this.showComments = !this.showComments; }
            },
            {separator: true},
            {
                label: 'Annuler la tâche',
                icon: 'pi pi-ban',
                styleClass: 'danger-item',
                disabled: this.isCancelled,
                command: () => this.taskInstanceService.updateStatus(this.task.id, 'CANCELLED')
                    .subscribe(() => this.statusChanged.emit())
            },
            {
                label: 'Supprimer la tâche',
                icon: 'pi pi-trash',
                styleClass: 'danger-item',
                command: () => this.deleteTask()
            }
        ];
    }

    /**
     * Appelé quand une sous-tâche change de statut.
     * Met à jour localement la sous-tâche, puis auto-complète la tâche
     * parente si toutes les sous-tâches passent à DONE.
     */
    onSubtaskChanged(subtaskId: string, newStatus: string): void {
        // Mise à jour optimiste locale pour que every() reflète le nouvel état
        const subtask = (this.task.subtasks ?? []).find(s => s.id === subtaskId);
        if (subtask) subtask.status = newStatus as any;

        const subtasks = this.task.subtasks ?? [];
        const allDone = subtasks.length > 0 && subtasks.every(s => s.status === 'DONE');

        if (allDone && !this.isDone && !this.isCancelled) {
            // Toutes les sous-tâches sont DONE → passer la tâche à DONE
            this.taskInstanceService.updateStatus(this.task.id, 'DONE')
                .subscribe(() => this.statusChanged.emit());
        } else if (!allDone && this.isDone) {
            // Une sous-tâche décochée alors que la tâche était DONE → repasser en PENDING
            this.taskInstanceService.updateStatus(this.task.id, 'PENDING')
                .subscribe(() => this.statusChanged.emit());
        } else {
            this.statusChanged.emit();
        }
    }

    // ── Dialog sous-tâche ───────────────────────────────────────────────────
    openAddSubtaskDialog(): void {
        this.editingSubtask = null;
        this.showSubtaskDialog.set(true);
    }

    openEditSubtaskDialog(subtask: ISubtaskInstance): void {
        this.editingSubtask = subtask;
        this.showSubtaskDialog.set(true);
    }

    onSubtaskDialogConfirm(draft: any): void {
        if (!draft) return;
        if (this.editingSubtask) {
            // Mode édition → PATCH : utilise la réponse pour mettre à jour localement
            this.taskInstanceService.patchSubtask(this.editingSubtask.id, draft)
                .subscribe(updated => {
                    // Mise à jour locale immédiate dans le tableau des sous-tâches
                    const idx = this.task.subtasks.findIndex(s => s.id === updated.id);
                    if (idx !== -1) {
                        this.task.subtasks = [
                            ...this.task.subtasks.slice(0, idx),
                            updated,
                            ...this.task.subtasks.slice(idx + 1)
                        ];
                    }
                    this.editingSubtask = null;
                    this.statusChanged.emit();
                });
        } else {
            // Mode création → POST
            this.taskInstanceService.addSubtask(this.task.id, draft)
                .subscribe(created => {
                    // Ajout local immédiat
                    this.task.subtasks = [...this.task.subtasks, created];
                    this.showSubtasks = true;
                    this.statusChanged.emit();
                });
        }
    }

    onSubtaskDialogCancel(): void {
        this.editingSubtask = null;
    }

    deleteTask(): void {
        if (!confirm('Supprimer définitivement cette tâche et toutes ses sous-tâches ?')) return;
        this.taskInstanceService.delete(this.task.id)
            .subscribe(() => this.statusChanged.emit());
    }

    addComment(): void {
        if (!this.commentBody.trim() || !this.commentAuthor.trim()) return;
        this.taskInstanceService.addComment(this.task.id, {
            authorName: this.commentAuthor.trim(),
            body: this.commentBody.trim()
        }).subscribe(newComment => {
            this.commentBody = '';
            this.commentAuthor = '';
            this.showCommentInput = false;
            // Ajouter le commentaire localement sans rechargement complet
            if (!this.task.comments) this.task.comments = [];
            this.task.comments = [newComment, ...this.task.comments];
            this.showComments = true;
        });
    }

    saveResponsible(): void {
        this.taskInstanceService.patch(this.task.id, {responsible: this.editResponsibleValue.trim() || null})
            .subscribe(updated => {
                this.task.responsible = updated.responsible;
                this.editingResponsible = false;
                this.statusChanged.emit();
            });
    }

    cancelResponsible(): void {
        this.editingResponsible = false;
    }


    toggleComments(): void {
        this.showComments = !this.showComments;
    }
}
