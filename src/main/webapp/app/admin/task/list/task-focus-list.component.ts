import {ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {Toast} from 'primeng/toast';
import {filter} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {ContentPageComponent} from 'app/shared/components/content-page/content-page.component';
import {DialogBoxComponent} from 'app/shared/components/dialog-box/dialog-box.component';
import {MenuBoxComponent} from 'app/shared/components/menu-box/menu-box.component';
import {
    applyChipFilters,
    EntityAction,
    EntityGroup,
    EntityListState,
    FilterChipGroup,
    groupByKey,
    matchesSearch
} from 'app/shared/components/entity-list';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {ActionFormDialogComponent} from 'app/shared/action-form-dialog/action-form-dialog.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {AppMenuItem} from 'app/shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from 'app/shared/utils/menu-item-builder.service';
import {AvailableAction} from 'app/shared/model/available-action';
import {ActionsService} from '../../common/actions.service';
import {ISalon} from '../../salon/model/salon.interface';
import {SalonService} from '../../salon/service/salon.service';
import {IFlatSubtask, ISubtaskInstance, ITaskInstance, TaskStatus} from '../model/task-instance.interface';
import {TaskInstanceService} from '../service/task-instance.service';
import {TaskCardComponent} from '../detail/task-card.component';
import {TaskInstanceFormComponent} from '../dialog/task-instance-form.component';
import {SubtaskInstanceFormComponent} from '../dialog/subtask-instance-form.component';
import {TaskCalendarComponent} from '../calendar/task-calendar.component';
import {
    CalendarQuickAddComponent,
    QuickAddRequest,
    SubtaskEditRequest
} from '../calendar/calendar-quick-add.component';
import {CalendarView, DEFAULT_VIEW, normalizeView, VIEW_STORAGE_KEY} from '../calendar/task-calendar.utils';
import {UNDO_TOAST_KEY} from '../shared/subtask-status-panel.component';
import {
    compareSubtasks,
    compareTasks,
    countSubtasks,
    daysUntil,
    flatten,
    formatShortDate,
    isActive,
    isLate,
    knownResponsibles,
    next14Predicate,
    ownerOf,
    responsibleColor,
    statusColorOf,
    taskUrgency,
    toLocalDate,
    today as todayDate,
    URGENCY_ORDER,
    urgencyColor
} from '../shared/task-urgency.utils';

/** Les deux vues de l'écran, conservées dans l'URL (`?view=`). Calendrier par défaut. */
export type TaskView = 'tasks' | 'calendar';

const GROUP_URGENCY = 'urgency';
const GROUP_RESPONSIBLE = 'responsible';

/** Statuts proposés en puces de filtre. */
const CHIP_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

@Component({
               selector: 'app-task-focus-list',
               imports: [
                   SharedModule,
                   FormsModule,
                   ButtonBoxComponent,
                   ContentPageComponent,
                   DialogBoxComponent,
                   MenuBoxComponent,
                   ConfirmPopup,
                   Toast,
                   EntityListToolbarComponent,
                   EntityListGroupComponent,
                   TaskCardComponent,
                   TaskInstanceFormComponent,
                   SubtaskInstanceFormComponent,
                   TaskCalendarComponent,
                   CalendarQuickAddComponent
               ],
               templateUrl: './task-focus-list.component.html',
               styleUrl: './task-focus-list.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TaskFocusListComponent implements OnInit {
    readonly tasks = signal<ITaskInstance[]>([]);
    readonly salon = signal<ISalon | null>(null);
    readonly isLoading = signal<boolean>(false);
    readonly view = signal<TaskView>('calendar');
    /** Découpage du calendrier : Semaine ou Mois. */
    readonly calendarView = signal<CalendarView>(DEFAULT_VIEW);
    /** Date d'ancrage de la période affichée. */
    readonly calendarAnchor = signal<string>(todayDate());
    readonly undoKey = UNDO_TOAST_KEY;

    /** Plié/déplié choisi par l'utilisateur, qui prime sur la règle par défaut. */
    private readonly cardOverrides = signal<Record<string, boolean>>({});

    readonly showTaskDialog = signal<boolean>(false);
    readonly showSubtaskDialog = signal<boolean>(false);
    readonly editingTask = signal<ITaskInstance | null>(null);
    readonly editingSubtask = signal<ISubtaskInstance | null>(null);
    /** Tâche parente lors d'une création de sous-tâche (null en mode édition). */
    readonly newSubtaskParentTask = signal<ITaskInstance | null>(null);

    private readonly availableActions = signal<AvailableAction[]>([]);
    private salonId = '';

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly salonService = inject(SalonService);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly translateService = inject(TranslateService);
    private readonly modalService = inject(NgbModal);

    readonly state = new EntityListState({
                                             defaultGroupBy: GROUP_URGENCY,
                                             defaultSort: 'due',
                                             sortOptions: [],
                                             collapsedByDefault: groupBy =>
                                                 groupBy === GROUP_URGENCY ? ['DONE'] : []
                                         });

    /** Responsables du salon, triés : ils fixent la couleur des avatars. */
    readonly known = computed(() => knownResponsibles(this.tasks()));

    readonly allSubtasks = computed<IFlatSubtask[]>(() => flatten(this.tasks()));

    /** Responsable de la tâche parente de la sous-tâche en cours d'édition ou d'ajout. */
    readonly subtaskTaskResponsible = computed(() => {
        const editing = this.editingSubtask();
        const parent = editing
                       ? this.tasks().find(task => task.subtasks?.some(sub => sub.id === editing.id)) ?? null
                       : this.newSubtaskParentTask();
        return parent?.responsible ?? null;
    });

    private readonly predicates = computed<Record<string, (subtask: IFlatSubtask) => boolean>>(() => {
        const predicates: Record<string, (subtask: IFlatSubtask) => boolean> = {
            late: subtask => isLate(subtask),
            next14: subtask => next14Predicate(subtask),
            noResponsible: subtask => !ownerOf(subtask, subtask.parentTask)
        };

        CHIP_STATUSES.forEach(status => {
            predicates[`st_${status}`] = subtask => status === 'DONE'
                                                    ? !isActive(subtask)
                                                    : subtask.status === status;
        });

        this.known().forEach(name => {
            predicates[`resp_${name}`] = subtask => ownerOf(subtask, subtask.parentTask) === name;
        });

        return predicates;
    });

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.allSubtasks();
        const predicates = this.predicates();
        const groups: FilterChipGroup[] = [];

        groups.push({
                        key: 'status',
                        labelKey: 'entityList.filterGroup.status',
                        mode: 'or',
                        chips: CHIP_STATUSES.map(status => ({
                            key: `st_${status}`,
                            labelKey: `task.group.statusKey.${status}`,
                            dotColor: statusColorOf(status),
                            count: items.filter(predicates[`st_${status}`]).length,
                            alwaysVisible: true
                        }))
                    });

        groups.push({
                        key: 'signals',
                        labelKey: 'entityList.filterGroup.signals',
                        mode: 'and',
                        chips: [
                            {
                                key: 'late',
                                labelKey: 'task.chip.late',
                                icon: 'triangle-exclamation',
                                color: 'var(--app-danger)',
                                count: items.filter(predicates['late']).length
                            },
                            {
                                key: 'next14',
                                labelKey: 'task.chip.next14',
                                icon: 'calendar-days',
                                color: 'var(--app-primary)',
                                count: items.filter(predicates['next14']).length
                            },
                            {
                                key: 'noResponsible',
                                labelKey: 'task.chip.noResponsible',
                                icon: 'user-slash',
                                color: 'var(--app-warning)',
                                count: items.filter(predicates['noResponsible']).length
                            }
                        ]
                    });

        const known = this.known();
        if (known.length) {
            groups.push({
                            key: GROUP_RESPONSIBLE,
                            labelKey: 'task.list.filterResponsible',
                            mode: 'or',
                            chips: known.map(name => ({
                                key: `resp_${name}`,
                                labelKey: name,
                                rawLabel: true,
                                dotColor: responsibleColor(name, known),
                                count: items.filter(predicates[`resp_${name}`]).length
                            }))
                        });
        }

        return groups;
    });

    /** Sous-tâches filtrées puis triées par échéance effective. */
    readonly filteredSubtasks = computed<IFlatSubtask[]>(() => {
        const query = this.state.query();

        const searched = this.allSubtasks().filter(subtask => matchesSearch([
                                                                                subtask.title,
                                                                                subtask.parentTask.title,
                                                                                ownerOf(subtask, subtask.parentTask)
                                                                            ], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates());

        return [...filtered].sort(compareSubtasks);
    });

    /** Tâches filtrées par la recherche et les puces, triées par urgence. */
    readonly filteredTasks = computed<ITaskInstance[]>(() => {
        const tasks = this.tasks();

        if (!this.state.isFiltering) {
            return [...tasks].sort(compareTasks);
        }

        const query = this.state.query();
        const matchingIds = new Set(this.filteredSubtasks().map(subtask => subtask.parentTask.id));

        return tasks
            .filter(task => matchingIds.has(task.id) ||
                            (this.state.activeChips().length === 0 && matchesSearch([task.title], query)))
            .sort(compareTasks);
    });

    /** Tâches groupées par échéance, toujours sur ce critère (pas de sélecteur dans cette vue). */
    readonly taskGroups = computed<EntityGroup<ITaskInstance>[]>(() =>
        groupByKey(this.filteredTasks(),
                  URGENCY_ORDER,
                  taskUrgency,
                  key => `task.group.urgencyKey.${key}`,
                  key => urgencyColor(key)));

    readonly counts = computed(() => countSubtasks(this.allSubtasks()));

    /** Jours restants avant le début du salon. */
    readonly daysBeforeSalon = computed(() => daysUntil(this.salonStartingDate()));

    readonly salonDateLabel = computed(() => formatShortDate(this.salonStartingDate()));

    /** Vrai quand le backend propose encore de recalculer les dates du salon. */
    readonly isDatesDesynchronized = computed(() => {
        const action = this.availableActions().find(item => item.contextCode === 'salon-recalculate-task-dates');

        return !!action && !action.disabled;
    });

    readonly menuItems = computed<AppMenuItem[]>(() => {
        const staticItems: AppMenuItem[] = [
            {
                label: this.text('task.focusView.addTask'),
                icon: 'pi pi-plus',
                command: () => this.openAddTaskDialog()
            },
            {
                label: this.text('common.refresh'),
                icon: 'pi pi-sync',
                command: () => this.load()
            }
        ];

        const dynamicItems = this.menuItemBuilderService.buildMenuItemsFromActions(
            this.availableActions(),
            (action, htmlElement) => this.clickAction(action, htmlElement));

        return [...staticItems, ...(dynamicItems.length > 0 ? [{separator: true}, ...dynamicItems] : [])];
    });

    /** Aucune action serveur propre à une tâche n'est exposée pour l'instant. */
    readonly taskExtraActions: EntityAction[] = [];

    constructor() {
        this.state.connectQueryParams(this.activatedRoute, this.router);

        const view = this.activatedRoute.snapshot.queryParamMap.get('view');
        if (view === 'tasks' || view === 'calendar') {
            this.view.set(view);
        }

        // Vue du calendrier : `?cal=`, sinon la dernière préférence locale, sinon le défaut.
        // Un ancien `?weeks=` est simplement ignoré.
        const calendarViewParam = this.activatedRoute.snapshot.queryParamMap.get('cal');
        this.calendarView.set(normalizeView(calendarViewParam ?? localStorage.getItem(VIEW_STORAGE_KEY)));

        // Date d'ancrage : jamais mémorisée, seulement reprise de l'URL.
        const anchorParam = this.activatedRoute.snapshot.queryParamMap.get('date');
        if (anchorParam && /^\d{4}-\d{2}-\d{2}$/.test(anchorParam)) {
            this.calendarAnchor.set(anchorParam);
        }

        effect(() => {
            const current = this.view();
            const calendarView = this.calendarView();
            const anchor = this.calendarAnchor();

            untracked(() => {
                localStorage.setItem(VIEW_STORAGE_KEY, calendarView);
                void this.router.navigate([], {
                    relativeTo: this.activatedRoute,
                    queryParams: {
                        view: current === 'calendar' ? null : current,
                        cal: current === 'calendar' ? calendarView : null,
                        date: current === 'calendar' ? anchor : null,
                        weeks: null
                    },
                    queryParamsHandling: 'merge',
                    replaceUrl: true
                });
            });
        });
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.salonId = params.get('idSalon') ?? '';
            this.loadSalon();
            this.load();
            this.loadActions();
        });
    }

    load(): void {
        if (!this.salonId) {
            return;
        }

        this.isLoading.set(true);
        this.taskInstanceService.findAllBySalon(this.salonId)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(tasks => this.tasks.set(tasks ?? []));
    }

    setView(view: TaskView): void {
        this.view.set(view);
    }

    setCalendarView(view: CalendarView): void {
        this.calendarView.set(view);
    }

    setCalendarAnchor(anchor: string): void {
        this.calendarAnchor.set(anchor);
    }

    // ── Ajout rapide depuis le calendrier ───────────────────────────────────

    /** Jour cliqué ou sous-tâche à modifier, avec l'élément d'ancrage de la popin. */
    readonly quickAddRequest = signal<QuickAddRequest | null>(null);

    /** Début du salon au format `YYYY-MM-DD`, pour l'échéance « J± ». */
    readonly salonStartDay = computed(() => toLocalDate(this.salon()?.startingDate));

    get salonIdValue(): string {
        return this.salonId;
    }

    openQuickAdd(request: {day: string; element: HTMLElement}): void {
        this.quickAddRequest.set({mode: 'add', ...request});
    }

    /** Modification d'une sous-tâche depuis le calendrier : même popin que l'ajout. */
    openQuickEdit(request: SubtaskEditRequest): void {
        this.quickAddRequest.set({mode: 'edit', ...request});
    }

    // ── Vue Tâches ──────────────────────────────────────────────────────────

    /** Repliée par défaut, sauf la toute première carte ; tout s'ouvre pendant une recherche. */
    isExpanded(task: ITaskInstance): boolean {
        const override = this.cardOverrides()[task.id];
        if (override !== undefined) {
            return override;
        }

        return this.state.isFiltering || this.filteredTasks()[0]?.id === task.id;
    }

    setExpanded(task: ITaskInstance, expanded: boolean): void {
        this.cardOverrides.update(overrides => ({...overrides, [task.id]: expanded}));
    }

    // ── Groupes ──────────────────────────────────────────────────────────────

    isCollapsed(group: EntityGroup<unknown>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<unknown>, collapsed: boolean): void {
        this.state.setCollapsed(group.key, collapsed);
    }

    /** Résumé d'un en-tête de groupe de tâches : effectifs de ses sous-tâches. */
    taskGroupSummary(group: EntityGroup<ITaskInstance>): string {
        const counts = countSubtasks(flatten(group.items));
        const parts: string[] = [];

        if (counts.inProgress > 0) {
            parts.push(this.text('task.group.inProgress', {count: counts.inProgress}));
        }
        if (counts.blocked > 0) {
            parts.push(this.text('task.group.blocked', {count: counts.blocked}));
        }

        return parts.join(' · ');
    }

    // ── Dialogues ───────────────────────────────────────────────────────────

    openAddTaskDialog(): void {
        this.editingTask.set(null);
        this.showTaskDialog.set(true);
    }

    openEditTaskDialog(task: ITaskInstance): void {
        this.editingTask.set(task);
        this.showTaskDialog.set(true);
    }

    openEditSubtaskDialog(subtask: ISubtaskInstance): void {
        this.newSubtaskParentTask.set(null);
        this.editingSubtask.set(subtask);
        this.showSubtaskDialog.set(true);
    }

    openAddSubtaskDialog(task: ITaskInstance): void {
        this.editingSubtask.set(null);
        this.newSubtaskParentTask.set(task);
        this.showSubtaskDialog.set(true);
    }

    onTaskDialogConfirm(draft: Partial<ITaskInstance> | null): void {
        if (!draft) {
            return;
        }

        const editing = this.editingTask();
        const request = editing
                        ? this.taskInstanceService.patch(editing.id, draft)
                        : this.taskInstanceService.create(this.salonId, draft);

        request.subscribe(() => {
            this.editingTask.set(null);
            this.load();
        });
    }

    onSubtaskDialogConfirm(draft: Partial<ISubtaskInstance> | null): void {
        if (!draft) {
            return;
        }

        const editing = this.editingSubtask();
        const parentTask = this.newSubtaskParentTask();
        const request = editing
                        ? this.taskInstanceService.patchSubtask(editing.id, draft)
                        : parentTask
                          ? this.taskInstanceService.addSubtask(parentTask.id, draft)
                          : null;

        if (!request) {
            return;
        }

        request.subscribe(() => {
            this.editingSubtask.set(null);
            this.newSubtaskParentTask.set(null);
            this.load();
        });
    }

    onTaskDialogCancel(): void {
        this.editingTask.set(null);
    }

    onSubtaskDialogCancel(): void {
        this.editingSubtask.set(null);
        this.newSubtaskParentTask.set(null);
    }

    // ── Actions métier du salon ─────────────────────────────────────────────

    recalculateDates(target: HTMLElement): void {
        const action = this.availableActions().find(item => item.contextCode === 'salon-recalculate-task-dates');
        if (action) {
            this.clickAction(action, target);
        }
    }

    previousState(): void {
        window.history.back();
    }

    private salonStartingDate(): string | null {
        return toLocalDate(this.salon()?.startingDate);
    }

    private loadSalon(): void {
        if (!this.salonId) {
            return;
        }

        this.salonService.find(this.salonId).subscribe(response => this.salon.set(response.body));
    }

    private loadActions(): void {
        if (!this.salonId) {
            return;
        }

        this.actionsService.getAvailableActions('salon', this.salonId, 'task-list')
            .subscribe(actions => this.availableActions.set(actions));
    }

    private clickAction(action: AvailableAction, htmlElement?: HTMLElement): void {
        if (action.type !== 'BUSINESS') {
            return;
        }

        if (action.requiredFields && action.requiredFields.length > 0) {
            const modalRef = this.modalService.open(ActionFormDialogComponent, {size: 'lg'});
            modalRef.componentInstance.requiredFields = action.requiredFields;
            modalRef.componentInstance.actionLabelKey = action.labelKey;

            modalRef.result
                    .then((payload: Map<string, unknown>) => {
                        if (payload) {
                            this.executeBusinessAction(action.contextCode, payload);
                        }
                    })
                    .catch(() => {
                        // Fenêtre fermée sans validation.
                    });

            return;
        }

        const target = htmlElement ?? document.activeElement as HTMLElement;
        const confirmationKey = action.confirmationKey ?? 'common.confirmAction.default';

        this.confirmDialogService
            .confirmAction(target, confirmationKey, {actionLabel: this.text(action.labelKey)})
            .pipe(filter(confirmed => confirmed))
            .subscribe(() => this.executeBusinessAction(action.contextCode));
    }

    private executeBusinessAction(context: string, payload?: Map<string, unknown>): void {
        this.isLoading.set(true);

        this.actionsService.businessAction(context, this.salonId, payload)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(() => {
                this.load();
                this.loadActions();
            });
    }

    /** Groupes par responsable : « Sans responsable » en tête, puis l'ordre alphabétique. */
    private text(key: string, params?: object): string {
        return this.translateService.instant(key, params) as string;
    }
}
