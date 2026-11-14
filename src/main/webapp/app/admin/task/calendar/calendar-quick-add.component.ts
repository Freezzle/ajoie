import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, output, signal, viewChild} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NgTemplateOutlet} from '@angular/common';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {MessageService} from 'primeng/api';
import {Popover} from 'primeng/popover';
import {forkJoin, Subscription, switchMap} from 'rxjs';

import {BottomSheetComponent} from '../../../shared/components/bottom-sheet/bottom-sheet.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {IFlatSubtask, ISubtaskInstance, ITaskInstance} from '../model/task-instance.interface';
import {SubtaskInstanceFormGroup, SubtaskInstanceFormService} from '../service/subtask-instance-form.service';
import {TaskInstanceService} from '../service/task-instance.service';
import {DueDateControls, DueDateFieldComponent} from '../shared/due-date-field.component';
import {RepeatControls, RepeatFieldComponent} from '../shared/repeat-field.component';
import {ResponsibleFieldComponent} from '../shared/responsible-field.component';
import {UNDO_TOAST_KEY} from '../shared/subtask-status-panel.component';
import {offsetFromSalon} from '../shared/task-urgency.utils';
import {longWeekday, shortDayMonth} from './task-calendar.utils';

/** Nombre de tâches conservées en tête de liste. */
const RECENT_LIMIT = 3;
const RECENT_STORAGE_KEY = 'task.quickAdd.recent';

/** Largeur en dessous de laquelle la popin devient une feuille du bas. */
const NARROW_WIDTH = 600;

/** Demande d'édition émise par une sous-tâche du calendrier. */
export interface SubtaskEditRequest {
    subtask: IFlatSubtask;
    element: HTMLElement;
}

/** Ajout sur un jour cliqué, ou modification d'une sous-tâche existante. */
export type QuickAddRequest =
    | {mode: 'add'; day: string; element: HTMLElement}
    | {mode: 'edit'; subtask: IFlatSubtask; element: HTMLElement};

/**
 * Ajout rapide ou modification d'une sous-tâche depuis le calendrier : popover
 * ancrée sur le jour (ou la sous-tâche) sur grand écran, feuille du bas sur mobile.
 * À l'ajout, l'échéance est préremplie avec le jour choisi et la saisie peut
 * s'enchaîner sans refermer la popin.
 */
@Component({
               selector: 'app-calendar-quick-add',
               templateUrl: './calendar-quick-add.component.html',
               styleUrl: './calendar-quick-add.component.scss',
               imports: [
                   FormsModule,
                   ReactiveFormsModule,
                   NgTemplateOutlet,
                   Popover,
                   BottomSheetComponent,
                   ButtonBoxComponent,
                   CheckboxBoxComponent,
                   SelectBoxComponent,
                   TextBoxComponent,
                   TextareaBoxComponent,
                   DueDateFieldComponent,
                   ResponsibleFieldComponent,
                   RepeatFieldComponent
               ],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class CalendarQuickAddComponent {
    /** Jour cliqué ou sous-tâche à modifier, avec l'élément d'ancrage de la popover. */
    readonly request = input.required<QuickAddRequest | null>();
    readonly tasks = input<ITaskInstance[]>([]);
    readonly known = input<string[]>([]);
    /** Début du salon (`YYYY-MM-DD`), nécessaire pour l'échéance « J± ». */
    readonly salonStart = input<string | null>(null);
    readonly salonId = input<string>('');

    /** Une sous-tâche (et parfois une tâche) vient d'être créée ou modifiée : la liste doit être rechargée. */
    readonly saved = output<void>();
    readonly closed = output<void>();

    private readonly popover = viewChild<Popover>('popover');

    private readonly formService = inject(SubtaskInstanceFormService);
    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly messageService = inject(MessageService);
    private readonly translateService = inject(TranslateService);

    readonly form = signal<FormGroup<SubtaskInstanceFormGroup>>(this.formService.createFormGroup(null));

    /** Abonnement de cohérence de la répétition, refait à chaque nouveau formulaire. */
    private repeatSync: Subscription = this.formService.registerRepeatSync(this.form());

    /** Tâche de rattachement choisie. */
    readonly taskControl = new FormControl<ITaskInstance | null>(null, [Validators.required]);
    /** Titre de la tâche à créer, en mode « nouvelle tâche ». */
    readonly newTaskControl = new FormControl<string | null>('', [Validators.required, Validators.maxLength(500)]);

    /** Mode « nouvelle tâche » : on saisit le titre de la tâche en plus de la sous-tâche. */
    readonly creatingTask = signal<boolean>(false);
    /** Sous-tâche en cours de modification, `null` en ajout. */
    readonly editing = signal<IFlatSubtask | null>(null);
    readonly showMore = signal<boolean>(false);
    readonly saving = signal<boolean>(false);
    /** En dessous de 600 px, la popin devient une feuille du bas. */
    readonly mobile = signal<boolean>(typeof window !== 'undefined' && window.innerWidth < NARROW_WIDTH);

    private readonly recent = signal<string[]>(readRecent());

    /** Valeurs suivies pour réévaluer `canSave()` à chaque frappe. */
    private readonly selectedTask = toSignal(this.taskControl.valueChanges, {initialValue: null});
    private readonly newTaskTitle = toSignal(this.newTaskControl.valueChanges, {initialValue: ''});

    constructor() {
        inject(DestroyRef).onDestroy(() => this.repeatSync.unsubscribe());

        effect(() => {
            const request = this.request();
            if (!request) {
                this.popover()?.hide();

                return;
            }

            this.mobile.set(window.innerWidth < NARROW_WIDTH);

            if (request.mode === 'edit') {
                this.resetForEdit(request.subtask);
            } else {
                this.reset(request.day);
            }

            this.open(request.element);
        });
    }

    /** Vue restreinte du formulaire passée au champ d'échéance. */
    readonly dueDateForm = computed(() => this.form() as unknown as FormGroup<DueDateControls>);

    /** Vue restreinte du formulaire passée au champ de répétition. */
    readonly repeatForm = computed(() => this.form() as unknown as FormGroup<RepeatControls>);

    /** « vendredi 12 décembre » en ajout, « Modifier la sous-tâche » en modification. */
    readonly dayLabel = computed(() => {
        const request = this.request();
        if (!request) {
            return '';
        }

        if (request.mode === 'edit') {
            return this.text('task.dialog.editSubtask');
        }

        return `${longWeekday(request.day)} ${shortDayMonth(request.day)}`;
    });

    /** Tâches proposées, les dernières utilisées en tête. */
    readonly taskOptions = computed<ITaskInstance[]>(() => {
        const recent = this.recent();
        const rank = (task: ITaskInstance) => {
            const index = recent.indexOf(task.id);

            return index === -1 ? recent.length : index;
        };

        return [...this.tasks()].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, 'fr'));
    });

    readonly taskLabel = (task: ITaskInstance | null): string => task?.title ?? '';

    /** Marque les tâches récemment utilisées dans la liste déroulante. */
    readonly taskHint = (task: ITaskInstance | null): string | null =>
        task && this.recent().includes(task.id) ? this.text('task.quickAdd.recent') : null;

    /** Prêt à enregistrer : un titre et une tâche (existante ou nouvelle). */
    readonly canSave = computed(() => {
        if (this.saving()) {
            return false;
        }

        if (this.editing()) {
            return true;
        }

        return this.creatingTask()
               ? (this.newTaskTitle() ?? '').trim().length > 0
               : !!this.selectedTask();
    });

    startCreatingTask(): void {
        this.creatingTask.set(true);
        this.taskControl.setValue(null);
        this.newTaskControl.setValue('');
    }

    cancelCreatingTask(): void {
        this.creatingTask.set(false);
        this.newTaskControl.setValue('');
    }

    /** Entrée dans le champ titre : ajoute et laisse la popin ouverte pour enchaîner. */
    onTitleEnter(event: Event): void {
        event.preventDefault();
        this.save(!this.editing());
    }

    save(keepOpen: boolean): void {
        const form = this.form();
        if (form.invalid) {
            form.markAllAsTouched();

            return;
        }

        if (!this.canSave()) {
            return;
        }

        const draft = this.formService.getSubtaskInstance(form) as Partial<ISubtaskInstance>;
        this.saving.set(true);

        const editing = this.editing();
        if (editing) {
            this.taskInstanceService.patchSubtask(editing.id, draft).subscribe({
                next: () => {
                    this.saving.set(false);
                    this.saved.emit();
                    this.close();
                },
                error: () => this.saving.set(false)
            });

            return;
        }

        if (this.creatingTask()) {
            this.createTaskThenSubtask(draft, keepOpen);

            return;
        }

        const task = this.selectedTask()!;
        this.taskInstanceService.addSubtask(task.id, draft).subscribe({
            next: created => this.onCreated(task.id, created, keepOpen),
            error: () => this.saving.set(false)
        });
    }

    close(): void {
        this.popover()?.hide();
        this.closed.emit();
    }

    /** Ancre et ouvre la popover sur la case cliquée. */
    private open(element: HTMLElement): void {
        if (this.mobile()) {
            this.focusTitle();

            return;
        }

        // `show(null, cible)` : la popover n'est pas déclenchée par un clic sur elle-même.
        setTimeout(() => {
            // La case a pu disparaître entre-temps (changement de période).
            if (element.isConnected) {
                this.popover()?.show(null, element);
                this.focusTitle();
            }
        });
    }

    private focusTitle(): void {
        setTimeout(() => document.getElementById('field_quickAddTitle')?.focus(), 50);
    }

    /** Remplace le formulaire courant et réaccroche la cohérence de la répétition. */
    private setForm(form: FormGroup<SubtaskInstanceFormGroup>): void {
        this.repeatSync.unsubscribe();
        this.form.set(form);
        this.repeatSync = this.formService.registerRepeatSync(form);
    }

    /** Formulaire vierge dont l'échéance tombe sur le jour cliqué. */
    private reset(day: string): void {
        const form = this.formService.createFormGroup(null);
        this.setForm(form);
        this.editing.set(null);
        this.taskControl.enable({emitEvent: false});
        this.creatingTask.set(false);
        this.newTaskControl.setValue('');
        this.showMore.set(false);
        this.saving.set(false);

        const salonStart = this.salonStart();
        if (salonStart) {
            form.controls.dueDateType.setValue('OFFSET');
            form.controls.dueDateOffset.setValue(offsetFromSalon(day, salonStart));
        } else {
            form.controls.dueDateType.setValue('FIXED');
            form.controls.dueDateFixed.setValue(new Date(`${day}T00:00:00`));
        }
    }

    /** Formulaire prérempli avec la sous-tâche à modifier ; la tâche parente est figée. */
    private resetForEdit(subtask: IFlatSubtask): void {
        this.setForm(this.formService.createFormGroup(subtask));
        this.editing.set(subtask);
        this.creatingTask.set(false);
        this.newTaskControl.setValue('');
        this.saving.set(false);
        this.showMore.set(!!subtask.description || !!subtask.supplierInfo);

        // Le déplacement vers une autre tâche n'est pas géré par l'API : champ figé.
        const parent = this.tasks().find(task => task.id === subtask.taskInstanceId) ?? subtask.parentTask;
        this.taskControl.setValue(parent);
        this.taskControl.disable({emitEvent: false});
    }

    /** Crée la tâche puis sa première sous-tâche : deux appels, pas de transaction. */
    private createTaskThenSubtask(draft: Partial<ISubtaskInstance>, keepOpen: boolean): void {
        const title = (this.newTaskControl.value ?? '').trim();
        let createdTask: ITaskInstance | null = null;

        this.taskInstanceService.create(this.salonId(), {title})
            .pipe(switchMap(task => {
                createdTask = task;

                return this.taskInstanceService.addSubtask(task.id, draft);
            }))
            .subscribe({
                           next: created => {
                               this.cancelCreatingTask();
                               this.taskControl.setValue(createdTask);
                               this.onCreated(createdTask!.id, created, keepOpen);
                           },
                           error: () => {
                               this.saving.set(false);

                               // La tâche existe peut-être déjà : on la sélectionne pour éviter un doublon.
                               if (createdTask) {
                                   this.cancelCreatingTask();
                                   this.taskControl.setValue(createdTask);
                                   this.saved.emit();
                                   this.error('task.quickAdd.subtaskFailed');
                               } else {
                                   this.error('task.quickAdd.taskFailed');
                               }
                           }
                       });
    }

    private onCreated(taskId: string, created: ISubtaskInstance[], keepOpen: boolean): void {
        this.saving.set(false);
        this.rememberTask(taskId);
        this.saved.emit();
        this.toastAdded(created);

        if (!keepOpen) {
            this.close();

            return;
        }

        // Ajout en chaîne : on garde la tâche et l'échéance, on vide le reste.
        const form = this.form();
        form.controls.title.setValue('');
        form.controls.description.setValue(null);
        form.controls.supplierInfo.setValue(null);
        form.controls.repeatEnabled.setValue(false);
        form.markAsUntouched();
        this.focusTitle();
    }

    /** Toast d'ajout ; l'annulation supprime toutes les occurrences créées. */
    private toastAdded(created: ISubtaskInstance[]): void {
        const first = created[0];
        if (!first) {
            return;
        }

        const summary = created.length > 1
                        ? this.text('task.quickAdd.addedRepeated', {title: first.title, count: created.length})
                        : this.text('task.quickAdd.added', {title: first.title});

        this.messageService.add({
                                    key: UNDO_TOAST_KEY,
                                    severity: 'success',
                                    summary,
                                    life: 6000,
                                    data: {
                                        undo: () => forkJoin(created.map(subtask => this.taskInstanceService.deleteSubtask(subtask.id)))
                                            .subscribe(() => this.saved.emit())
                                    }
                                });
    }

    private error(key: string): void {
        this.messageService.add({severity: 'error', summary: this.text(key), life: 8000});
    }

    private rememberTask(taskId: string): void {
        const next = [taskId, ...this.recent().filter(id => id !== taskId)].slice(0, RECENT_LIMIT);
        this.recent.set(next);

        try {
            localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Stockage indisponible : les « Récentes » ne survivront pas au rechargement.
        }
    }

    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}

function readRecent(): string[] {
    try {
        const raw: unknown = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) ?? '[]');

        return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
    } catch {
        return [];
    }
}
