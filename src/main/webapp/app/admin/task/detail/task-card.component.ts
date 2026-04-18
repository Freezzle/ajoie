import {Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {ISubtaskInstance, ITaskInstance} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {SubtaskRowComponent} from './subtask-row.component';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {SubtaskInstanceFormComponent} from '../dialog/subtask-instance-form.component';
import {Tag} from 'primeng/tag';
import {TaskFilter} from '../list/task-focus-list.component';
import {AccountService} from '../../../core/auth/account.service';

@Component({
    selector: 'app-task-card',
    templateUrl: './task-card.component.html',
    styleUrls: ['./task-card.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        MenuBoxComponent,
        ButtonBoxComponent,
        TextBoxComponent,
        TextareaBoxComponent,
        SubtaskRowComponent,
        TimeSincePipe,
        DialogBoxComponent,
        SubtaskInstanceFormComponent,
        Tag
    ]
})
export class TaskCardComponent implements OnInit {
    @Input() task!: ITaskInstance;
    @Input() activeFilter: TaskFilter = 'active';
    @Input() salonStartingDate: Date | null = null;
    @Output() statusChanged = new EventEmitter<void>();
    @Output() editRequested = new EventEmitter<void>();

    protected taskInstanceService = inject(TaskInstanceService);
    private accountService = inject(AccountService);
    private translateService = inject(TranslateService);

    showSubtasks = false;
    showComments = false;

    // Édition inline du responsable
    editingResponsible = false;
    editResponsibleValue = '';

    // Dialog sous-tâche (ajout / édition)
    showSubtaskDialog = signal(false);
    editingSubtask: ISubtaskInstance | null = null;

    // Dialog commentaire
    showCommentDialog = signal(false);
    commentForm!: FormGroup;

    ngOnInit(): void {
        this.commentForm = new FormGroup({
            authorName: new FormControl('', [Validators.required]),
            body: new FormControl('', [Validators.required]),
        });
    }

    /** Au moins une sous-tâche est IN_PROGRESS */
    get hasInProgressSubtask(): boolean {
        return (this.task.subtasks ?? []).some(s => s.status === 'IN_PROGRESS');
    }

    /** Au moins une sous-tâche est BLOCKED */
    get hasBlockedSubtask(): boolean {
        return (this.task.subtasks ?? []).some(s => s.status === 'BLOCKED');
    }

    get doneSubtaskCount(): number {
        return (this.task.subtasks ?? []).filter(s => s.status === 'DONE').length;
    }

    /** Sous-tâches filtrées selon le filtre actif, puis triées par dueDate (nulls en dernier) puis sortOrder */
    get sortedSubtasks() {
        const today = new Date().toISOString().split('T')[0];
        let subtasks = [...(this.task.subtasks ?? [])];
        const isSnoozed = (s: ISubtaskInstance) => !!s.snoozedUntil && s.snoozedUntil >= today;

        switch (this.activeFilter) {
            case 'active':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED');
                break;
            case 'late':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED' && !!s.dueDate && s.dueDate < today && !isSnoozed(s));
                break;
            case 'today':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED' && s.dueDate === today && !isSnoozed(s));
                break;
            case 'in_progress':
                subtasks = subtasks.filter(s => s.status === 'IN_PROGRESS');
                break;
            case 'done':
                subtasks = subtasks.filter(s => s.status === 'DONE');
                break;
            case 'snoozed':
                subtasks = subtasks.filter(s => s.status !== 'DONE' && s.status !== 'CANCELLED' && isSnoozed(s));
                break;
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
        if (!dueDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate + 'T00:00:00');
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
        if (diffDays < 0) return 'late';
        if (diffDays === 0) return 'today';
        if (diffDays <= 7) return 'soon';
        return 'ok';
    }

    get accentClass(): string {
        switch (this.dueDateStatus) {
            case 'late':  return 'tc--late';
            case 'today': return 'tc--today';
            case 'soon':  return 'tc--soon';
            default:      return 'tc--neutral';
        }
    }

    get menuItems(): AppMenuItem[] {
        const commentCount = (this.task.comments ?? []).length;
        return [
            {
                label: this.translateService.instant('task.menu.editTask') as string,
                icon: 'pi pi-pencil',
                command: () => this.editRequested.emit()
            },
            {separator: true},
            {
                label: this.translateService.instant('task.menu.addSubtask') as string,
                icon: 'pi pi-plus',
                command: () => this.openAddSubtaskDialog()
            },
            {
                label: this.translateService.instant('task.menu.addComment') as string,
                icon: 'pi pi-comment',
                command: () => {
                    this.commentForm.patchValue({authorName: this.accountService.trackCurrentAccount()()?.login ?? ''});
                    this.showCommentDialog.set(true);
                }
            },
            {
                label: commentCount > 0
                    ? this.translateService.instant('task.menu.commentsWithCount', {count: commentCount}) as string
                    : this.translateService.instant('task.menu.comments') as string,
                icon: 'pi pi-inbox',
                disabled: commentCount === 0,
                command: () => { this.showComments = !this.showComments; }
            },
            {separator: true},
            {
                label: this.translateService.instant('task.menu.deleteTask') as string,
                icon: 'pi pi-trash',
                styleClass: 'danger-item',
                command: () => this.deleteTask()
            }
        ];
    }

    /** Appelé quand une sous-tâche change de statut. */
    onSubtaskChanged(subtaskId: string, newStatus: string): void {
        const subtask = (this.task.subtasks ?? []).find(s => s.id === subtaskId);
        if (subtask) subtask.status = newStatus as any;
        this.statusChanged.emit();
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
        if (!confirm(this.translateService.instant('task.menu.deleteConfirm') as string)) return;
        this.taskInstanceService.delete(this.task.id)
            .subscribe(() => this.statusChanged.emit());
    }
    addComment(): void {
        if (this.commentForm.invalid) return;
        const raw = this.commentForm.getRawValue();
        this.taskInstanceService.addComment(this.task.id, {
            authorName: raw.authorName.trim(),
            body: raw.body.trim()
        }).subscribe(newComment => {
            this.commentForm.reset();
            this.showCommentDialog.set(false);
            // Ajouter le commentaire localement sans rechargement complet
            if (!this.task.comments) this.task.comments = [];
            this.task.comments = [newComment, ...this.task.comments];
            this.showComments = true;
        });
    }

    deleteComment(commentId: string): void {
        this.taskInstanceService.deleteComment(commentId).subscribe(() => {
            this.task.comments = this.task.comments.filter(c => c.id !== commentId);
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
