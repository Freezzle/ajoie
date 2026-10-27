import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    model,
    output,
    signal
} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {filter, switchMap} from 'rxjs';

import SharedModule from '../../../shared/shared.module';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {EntityActionsMenuComponent} from '../../../shared/components/entity-list/entity-actions-menu.component';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {EntityHighlightComponent} from '../../../shared/components/entity-list/entity-highlight.component';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {TimeSincePipe} from '../../../shared/pipe/time-since.pipe';
import {AccountService} from '../../../core/auth/account.service';
import {ISubtaskInstance, ITaskInstance} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {SubtaskLineComponent} from './subtask-line.component';
import {DueLabelComponent} from '../shared/due-label.component';
import {
    countSubtasks,
    isActive,
    isLate,
    sortedSubtasks,
    statusColorOf,
    urgency
} from '../shared/task-urgency.utils';

/** Segment de la barre de progression d'une carte : une sous-tâche. */
interface Segment {
    id: string;
    color: string;
    hint: string;
}

/**
 * Carte d'une tâche : en-tête repliable, barre segmentée, rouage d'actions et,
 * une fois dépliée, les lignes de sous-tâches et l'ajout rapide.
 */
@Component({
               selector: 'app-task-card',
               imports: [
                   SharedModule,
                   FormsModule,
                   ReactiveFormsModule,
                   DialogBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   EntityActionsMenuComponent,
                   EntityHighlightComponent,
                   TimeSincePipe,
                   SubtaskLineComponent,
                   DueLabelComponent
               ],
               templateUrl: './task-card.component.html',
               styleUrl: './task-card.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TaskCardComponent {
    readonly task = input.required<ITaskInstance>();
    readonly known = input<string[]>([]);
    readonly query = input<string>('');
    /** Actions métier serveur, ajoutées après un séparateur. */
    readonly extraActions = input<EntityAction[]>([]);

    readonly expanded = model<boolean>(false);

    readonly changed = output<void>();
    readonly editRequested = output<ITaskInstance>();
    readonly subtaskAddRequested = output<ITaskInstance>();
    readonly subtaskEditRequested = output<ISubtaskInstance>();
    readonly seeInList = output<ITaskInstance>();

    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly translateService = inject(TranslateService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly accountService = inject(AccountService);

    readonly showDone = signal<boolean>(false);
    readonly showComments = signal<boolean>(false);
    readonly showCommentDialog = signal<boolean>(false);

    readonly commentForm = new FormGroup({
                                             authorName: new FormControl('', [Validators.required]),
                                             body: new FormControl('', [Validators.required])
                                         });

    readonly subtasks = computed(() => sortedSubtasks(this.task()));

    readonly activeSubtasks = computed(() => this.subtasks().filter(isActive));

    readonly doneSubtasks = computed(() => this.subtasks().filter(subtask => !isActive(subtask)));

    readonly counts = computed(() => countSubtasks(this.subtasks()));

    readonly hasLate = computed(() => this.counts().late > 0);

    /** Prochaine sous-tâche active, affichée quand la carte est repliée. */
    readonly next = computed<ISubtaskInstance | null>(() => this.activeSubtasks()[0] ?? null);

    readonly comments = computed(() => [...(this.task().comments ?? [])]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

    readonly segments = computed<Segment[]>(() => this.subtasks().map(subtask => ({
        id: subtask.id,
        color: this.segmentColor(subtask),
        hint: `${subtask.title} · ${this.text(`task.status.${subtask.status}`)}`
    })));

    readonly actions = computed<EntityAction[]>(() => {
        const commentCount = this.comments().length;
        const extra = this.extraActions();

        const base: EntityAction[] = [
            {
                labelKey: 'task.menu.editTask',
                icon: 'pi pi-pencil',
                run: () => this.editRequested.emit(this.task())
            },
            {
                labelKey: 'task.menu.addSubtask',
                icon: 'pi pi-plus',
                separatorBefore: true,
                run: () => this.subtaskAddRequested.emit(this.task())
            },
            {
                labelKey: 'task.menu.addComment',
                icon: 'pi pi-comment',
                run: () => this.openCommentDialog()
            },
            {
                labelKey: commentCount > 0 ? 'task.menu.commentsWithCount' : 'task.menu.comments',
                labelParams: {count: commentCount},
                icon: 'pi pi-inbox',
                disabled: commentCount === 0,
                run: () => this.toggleComments()
            },
            {
                labelKey: 'task.menu.deleteTask',
                icon: 'pi pi-trash',
                danger: true,
                separatorBefore: true,
                run: target => this.deleteTask(target)
            }
        ];

        return extra.length > 0
               ? [...base, ...extra.map((action, index) => index === 0 ? {...action, separatorBefore: true} : action)]
               : base;
    });

    toggle(event: Event): void {
        // Le rouage et son menu ne doivent pas plier la carte.
        if ((event.target as HTMLElement).closest('entity-actions-menu')) {
            return;
        }

        this.expanded.set(!this.expanded());
    }

    toggleDone(): void {
        this.showDone.set(!this.showDone());
    }

    toggleComments(): void {
        this.expanded.set(true);
        this.showComments.set(!this.showComments());
    }

    addComment(): void {
        if (this.commentForm.invalid) {
            return;
        }

        const raw = this.commentForm.getRawValue();

        this.taskInstanceService.addComment(this.task().id, {
            authorName: (raw.authorName ?? '').trim(),
            body: (raw.body ?? '').trim()
        }).subscribe(() => {
            this.commentForm.reset();
            this.showCommentDialog.set(false);
            this.showComments.set(true);
            this.changed.emit();
        });
    }

    deleteComment(commentId: string): void {
        this.taskInstanceService.deleteComment(commentId).subscribe(() => this.changed.emit());
    }

    openCommentDialog(): void {
        this.commentForm.patchValue({authorName: this.accountService.trackCurrentAccount()()?.login ?? ''});
        this.showCommentDialog.set(true);
    }

    private deleteTask(target: HTMLElement): void {
        this.confirmDialogService.confirmAction(target, 'task.menu.deleteConfirm')
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.taskInstanceService.delete(this.task().id))
            )
            .subscribe(() => this.changed.emit());
    }

    private segmentColor(subtask: ISubtaskInstance): string {
        if (subtask.status === 'CANCELLED') {
            return 'var(--app-border)';
        }
        if (subtask.status !== 'PENDING') {
            return statusColorOf(subtask.status);
        }
        if (isLate(subtask)) {
            return 'var(--app-danger)';
        }

        return urgency(subtask) === 'TODAY' ? 'var(--app-warning)' : 'var(--app-border)';
    }

    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}
