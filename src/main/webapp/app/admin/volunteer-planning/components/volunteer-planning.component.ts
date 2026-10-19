import {ChangeDetectionStrategy, Component, computed, HostListener, inject, model, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {BreakpointObserver} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';

import {ConfirmPopup} from 'primeng/confirmpopup';
import {Tab, TabList, Tabs} from 'primeng/tabs';
import {ToastModule} from 'primeng/toast';
import {MenuItem, MessageService} from 'primeng/api';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';

import {CategoryManagerComponent} from './category-manager/category-manager.component';
import {SelectedDayAssignmentsComponent} from './selected-day-assignments/selected-day-assignments.component';
import {VolunteerManagerComponent} from './volunteer-manager/volunteer-manager.component';
import {SelectedDayEditorComponent} from './selected-day-editor/selected-day-editor.component';
import {PlanningLinkedViewComponent} from './linked-view/planning-linked-view.component';
import {PlanningMobileComponent} from './mobile/planning-mobile.component';

import {DayConfigSlice} from './volunteer-planning-slices';
import {Day} from './volunteer-planning-model';
import {deleteRun, formatHours} from './volunteer-planning-utils';
import {ViewMode, VolunteerPlanningStore} from './volunteer-planning.store';

@Component({
               selector: 'app-volunteer-planning',
               standalone: true,
               imports: [
                   FormsModule,
                   ConfirmPopup,
                   ToastModule,
                   Tabs,
                   TabList,
                   Tab,
                   TranslatePipe,

                   ContentPageComponent,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   CardComponent,
                   MenuBoxComponent,
                   DialogBoxComponent,

                   CategoryManagerComponent,
                   SelectedDayAssignmentsComponent,
                   VolunteerManagerComponent,
                   SelectedDayEditorComponent,
                   PlanningLinkedViewComponent,
                   PlanningMobileComponent
               ],
               providers: [VolunteerPlanningStore],
               templateUrl: './volunteer-planning.component.html',
               styleUrls: ['./volunteer-planning.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class VolunteerPlanningComponent implements OnInit {
    readonly store = inject(VolunteerPlanningStore);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly messageService = inject(MessageService);
    private readonly translate = inject(TranslateService);

    private idSalon = '';

    readonly isMobile = toSignal(
        this.breakpointObserver.observe('(max-width: 991.98px)').pipe(map(state => state.matches)),
        {initialValue: false}
    );

    readonly dayDialogVisible = model(false);
    readonly volunteersDialogVisible = model(false);
    readonly assignmentsDialogVisible = model(false);
    readonly categoriesDialogVisible = model(false);
    readonly showConfirmDeleteDay = signal(false);
    readonly manageDayCreateMode = signal(false);
    readonly manageDaySelectedDayId = signal<string>('');

    readonly viewOptions: { mode: ViewMode; icon: string; key: string }[] = [
        {mode: 'both', icon: 'pi pi-window-maximize', key: 'planningVolunteers.view.both'},
        {mode: 'person', icon: 'pi pi-user', key: 'planningVolunteers.view.persons'},
        {mode: 'zone', icon: 'pi pi-th-large', key: 'planningVolunteers.view.zones'}
    ];

    readonly plannedHoursLabel = computed(() => formatHours(this.store.stats().plannedHours));

    readonly focusedVolunteerLabel = computed(() => {
        const id = this.store.focusVolunteerId();
        return this.store.planning().volunteers.find(v => v.id === id)?.label ?? '';
    });

    readonly daySlice = computed<DayConfigSlice>(() => {
        if (this.manageDayCreateMode()) {
            return {day: this.store.createEmptyDay(this.manageDaySelectedDayId())};
        }
        return this.store.daySlice();
    });

    readonly dayMenus = computed(() => new Map(this.store.days().map(d => [d.id, this.dayActionItems()])));

    ngOnInit(): void {
        this.activatedRoute.paramMap
            .pipe(map(params => params.get('idSalon')!))
            .subscribe(idSalon => {
                this.idSalon = idSalon;
                this.store.load(idSalon);
            });
    }

    // ---------- en-tête ----------

    previousState(): void {
        window.history.back();
    }

    activateEditMode(): void {
        this.store.activateEditMode();
    }

    cancelEdition(): void {
        this.store.activateReadOnlyMode();
        this.store.load(this.idSalon);
    }

    save(): void {
        this.store.save(() => this.store.activateReadOnlyMode());
    }

    // ---------- jours ----------

    selectDay(dayId: string): void {
        this.store.selectDay(dayId);
    }

    addNewDay(): void {
        this.manageDayCreateMode.set(true);
        this.manageDaySelectedDayId.set(generateUUID());
        this.dayDialogVisible.set(true);
    }

    onManageDayConfirm(slice: DayConfigSlice): void {
        if (this.manageDayCreateMode()) {
            const day: Day = {
                ...slice.day,
                cells: slice.day.cells ?? [],
                unavailableCells: slice.day.unavailableCells ?? [],
                needs: slice.day.needs ?? []
            };
            this.store.addDay(day);
            this.manageDayCreateMode.set(false);
            this.manageDaySelectedDayId.set('');
        } else {
            this.store.applyDaySlice(slice);
        }
        this.dayDialogVisible.set(false);
    }

    closeDayDialog(): void {
        this.dayDialogVisible.set(false);
        this.manageDayCreateMode.set(false);
        this.manageDaySelectedDayId.set('');
    }

    openDeleteDayConfirm(): void {
        this.showConfirmDeleteDay.set(true);
    }

    confirmDeleteSelectedDay(): void {
        this.store.deleteSelectedDay();
        this.showConfirmDeleteDay.set(false);
    }

    // ---------- vue ----------

    setViewMode(mode: ViewMode): void {
        this.store.viewMode.set(mode);
        this.store.blockSelection.set(null);
        if (mode === 'person') {
            // les zones ne sont plus affichées : la plage sélectionnée n'a plus de sens
            this.store.zoneSelection.set(null);
        }
    }

    clearFocus(): void {
        this.store.focusVolunteerId.set(null);
    }

    // ---------- raccourcis clavier ----------

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest?.('input, textarea, select, [contenteditable="true"], .p-dialog')) {
            return;
        }
        if (this.dayDialogVisible() || this.volunteersDialogVisible()
            || this.assignmentsDialogVisible() || this.categoriesDialogVisible()
            || this.showConfirmDeleteDay()) {
            return;
        }

        if (event.key === 'Escape') {
            this.store.blockSelection.set(null);
            this.store.zoneSelection.set(null);
            this.store.focusVolunteerId.set(null);
            return;
        }

        if (this.store.isReadOnly()) {
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (this.store.undo()) {
                this.messageService.add({
                                            severity: 'info',
                                            detail: this.translate.instant('planningVolunteers.toast.undone'),
                                            life: 1500
                                        });
            }
            return;
        }

        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            const run = this.store.blockSelection();
            if (run) {
                event.preventDefault();
                this.store.updateDay(day => deleteRun(day, run));
                this.store.blockSelection.set(null);
            }
            return;
        }

        const num = this.digitFromEvent(event);
        if (num !== null) {
            const category = this.store.categories()[num - 1];
            if (category) {
                this.store.tool.set({kind: 'CATEGORY', categoryId: category.id});
            }
            return;
        }

        if (event.key.toLowerCase() === 'e' || event.code === 'KeyE') {
            this.store.tool.set({kind: 'ERASER'});
            return;
        }
        if (event.key.toLowerCase() === 'x' || event.code === 'KeyX') {
            this.store.tool.set({kind: 'UNAVAILABLE'});
        }
    }

    /**
     * Les chiffres sont lus via `event.code` en complément de `event.key` : sur les dispositions
     * où la rangée de chiffres est en position secondaire (AZERTY), `event.key` renvoie `é`, `"`…
     */
    private digitFromEvent(event: KeyboardEvent): number | null {
        const fromKey = Number(event.key);
        if (Number.isInteger(fromKey) && fromKey >= 1 && fromKey <= 9) {
            return fromKey;
        }
        const match = /^Digit([1-9])$/.exec(event.code);
        return match ? Number(match[1]) : null;
    }

    private dayActionItems(): MenuItem[] {
        return [
            {
                label: this.translate.instant('planningVolunteers.manageDay'),
                icon: 'pi pi-calendar',
                command: () => this.dayDialogVisible.set(true)
            },
            {
                label: 'Assignement des bénévoles',
                icon: 'pi pi-user',
                command: () => this.assignmentsDialogVisible.set(true)
            },
            {
                label: 'Supprimer le jour',
                icon: 'pi pi-trash',
                styleClass: 'p-menuitem-danger',
                command: () => this.openDeleteDayConfirm()
            }
        ];
    }
}

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.floor(Math.random() * 16);
        const v = c === 'x' ? r : (r % 4) + 8;
        return v.toString(16);
    });
}
