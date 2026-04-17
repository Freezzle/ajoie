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
import {SubtaskInstanceFormComponent} from '../dialog/subtask-instance-form.component';
import {ProgressBar} from 'primeng/progressbar';
import {ToggleSwitch} from 'primeng/toggleswitch';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {TranslateService} from '@ngx-translate/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ActionFormDialogComponent} from '../../../shared/action-form-dialog/action-form-dialog.component';
import {ConfirmDialogService} from '../../../shared/delete-dialog/confirm-dialog.service';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {filter} from 'rxjs';
import {SalonService} from '../../salon/service/salon.service';
import {ISalon} from '../../salon/model/salon.interface';

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
        SubtaskInstanceFormComponent,
        ProgressBar,
        ToggleSwitch,
        MenuBoxComponent,
        ConfirmPopup
    ]
})
export class TaskFocusListComponent implements OnInit {
    protected activatedRoute = inject(ActivatedRoute);
    protected taskInstanceService = inject(TaskInstanceService);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private readonly translateService = inject(TranslateService);
    private readonly modalService = inject(NgbModal);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly salonService = inject(SalonService);

    salonId: string = '';
    salon: ISalon | null = null;
    isLoading = false;
    tasks: ITaskInstance[] = [];
    activeFilter: TaskFilter = 'active';
    menuItems: AppMenuItem[] = [];
    availableActions: AvailableAction[] = [];

    /** Bascule entre la vue cards (false) et la vue sous-tâches à plat (true) */
    flatView = signal(false);
    /** Proxy booléen pour [(ngModel)] du p-toggleswitch */
    get flatViewBool(): boolean { return this.flatView(); }
    set flatViewBool(v: boolean) { this.flatView.set(v); }

    // Dialog ajout/édition tâche
    showTaskDialog = signal(false);
    editingTask: ITaskInstance | null = null;

    // Dialog édition sous-tâche (vue flat)
    showSubtaskDialog = signal(false);
    editingSubtask: ISubtaskInstance | null = null;

    ngOnInit(): void {
        this.salonId = this.activatedRoute.snapshot.paramMap.get('idSalon') ?? '';
        this.menuItems = this.buildMenuItems([]); // items statiques disponibles immédiatement
        this.loadSalon();
        this.load();
        this.loadActions();
    }

    loadSalon(): void {
        if (!this.salonId) return;
        this.salonService.find(this.salonId).subscribe(res => {
            this.salon = res.body;
        });
    }

    loadActions(): void {
        if (!this.salonId) return;
        this.actionsService.getAvailableActions('salon', this.salonId, 'task-list').subscribe(actions => {
            this.availableActions = actions;
            this.menuItems = this.buildMenuItems(actions);
        });
    }

    buildMenuItems(availableActions: AvailableAction[]): AppMenuItem[] {
        const staticItems: AppMenuItem[] = [
            {
                label: this.translateService.instant('task.focusView.addTask') as string,
                icon: 'pi pi-plus',
                command: () => this.openAddTaskDialog()
            },
            {
                label: this.translateService.instant('common.refresh') as string,
                icon: 'pi pi-sync',
                command: () => this.load()
            }
        ];

        const dynamicItems = this.menuItemBuilderService.buildMenuItemsFromActions(
            availableActions,
            (action, htmlElement) => this.clickAction(action, htmlElement)
        );

        return [...staticItems, ...(dynamicItems.length > 0 ? [{separator: true}, ...dynamicItems] : [])];
    }

    clickAction(action: AvailableAction, htmlElement?: HTMLElement): void {
        if (action.type === 'BUSINESS') {
            this.handleBusinessAction(action, this.salonId, htmlElement);
        }
    }

    private handleBusinessAction(action: AvailableAction, salonId: string, htmlElement?: HTMLElement): void {
        if (action.requiredFields && action.requiredFields.length > 0) {
            const modalRef = this.modalService.open(ActionFormDialogComponent, {size: 'lg'});
            modalRef.componentInstance.requiredFields = action.requiredFields;
            modalRef.componentInstance.actionLabelKey = action.labelKey;

            modalRef.result.then((payload: Map<string, any>) => {
                if (payload) {
                    this.executeBusinessAction(action.contextCode, salonId, payload);
                }
            }).catch(() => { /* dismissed */ });
        } else {
            const targetElement = htmlElement || document.activeElement as HTMLElement;
            const confirmMessageKey = action.confirmationKey || 'common.confirmAction.default';

            this.confirmDialogService.confirmAction(targetElement, confirmMessageKey, {
                actionLabel: this.translateService.instant(action.labelKey)
            })
                .pipe(filter(confirmed => confirmed))
                .subscribe(() => this.executeBusinessAction(action.contextCode, salonId));
        }
    }

    private executeBusinessAction(context: string, salonId: string, payload?: Map<string, any>): void {
        this.isLoading = true;
        this.actionsService.businessAction(context, salonId, payload)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe(() => {
                this.load();
                this.loadActions(); // Rafraîchir le menu après l'action
            });
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
                // Si toutes les sous-tâches sont terminées, basculer le filtre sur 'all'
                const allDone = this.countActive === 0 && this.countAll > 0;
                if (allDone && this.activeFilter === 'active') {
                    this.activeFilter = 'all';
                }
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

    // ── Dialog sous-tâche (vue flat) ────────────────────────────────────────
    openEditSubtaskDialog(subtask: ISubtaskInstance): void {
        this.editingSubtask = subtask;
        this.showSubtaskDialog.set(true);
    }

    onSubtaskDialogConfirm(draft: any): void {
        if (!draft || !this.editingSubtask) return;
        this.taskInstanceService.patchSubtask(this.editingSubtask.id, draft)
            .subscribe(() => {
                this.editingSubtask = null;
                this.load();
            });
    }

    onSubtaskDialogCancel(): void {
        this.editingSubtask = null;
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

    // ── Sous-tâches à plat (toutes tâches) ────────────────────────────────
    private get allSubtasks(): ISubtaskInstance[] {
        return this.tasks.flatMap(t => t.subtasks ?? []);
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
            case 'active':      return this.tasks.filter(t => (t.subtasks ?? []).length === 0 || this.hasActiveSubtask(t));
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
            .flatMap(t => (t.subtasks ?? []).map(s => ({...s, parentTask: t})));

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

    // ── Bandeau date de référence ────────────────────────────────────────────

    /** Date de début du salon formatée en dd.MM.yyyy */
    get salonStartingDateFormatted(): string {
        if (!this.salon?.startingDate) return '—';
        return new Date(this.salon.startingDate).toLocaleDateString('fr-CH', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    /** Date de début du salon sous forme d'objet Date (null si absente). */
    get salonStartingDate(): Date | null {
        if (!this.salon?.startingDate) return null;
        return new Date(this.salon.startingDate);
    }

    /**
     * Vrai si l'action "recalculer les dates" est présente et activée (toutes ses conditions sont OK).
     * Délègue entièrement la logique de désynchronisation au backend.
     */
    get isDatesDesynchronized(): boolean {
        const action = this.availableActions.find(a => a.contextCode === 'salon-recalculate-task-dates');
        return !!action && !action.disabled;
    }
}
