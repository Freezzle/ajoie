import {ChangeDetectionStrategy, Component, computed, HostListener, inject, model, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {BreakpointObserver} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';

import {ConfirmPopup} from 'primeng/confirmpopup';
import {ToastModule} from 'primeng/toast';
import {MenuItem, MessageService} from 'primeng/api';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {AppTab, TabBodyDirective, TabsComponent} from '../../../shared/components/tabs';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {SwitchBoxComponent, SwitchBoxOption} from '../../../shared/components/switch-box/switch-box.component';

import {VolunteerConfigDialogComponent} from './volunteer-config-dialog/volunteer-config-dialog.component';
import {PlanningLinkedViewComponent} from './linked-view/planning-linked-view.component';
import {PlanningMobileComponent} from './mobile/planning-mobile.component';

import {Planning} from './volunteer-planning-model';
import {deleteRun, formatHours} from './volunteer-planning-utils';
import {ViewMode, VolunteerPlanningStore} from './volunteer-planning.store';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';

@Component({
               selector: 'app-volunteer-planning',
               standalone: true,
               imports: [
                   FormsModule,
                   ConfirmPopup,
                   ToastModule,
                   TabsComponent,
                   TabBodyDirective,
                   TranslatePipe,

                   ContentPageComponent,
                   ButtonBoxComponent,
                   AlertErrorComponent,
                   CardComponent,
                   DialogBoxComponent,
                   SwitchBoxComponent,

                  VolunteerConfigDialogComponent,
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
    private readonly navigationStateService = inject(NavigationStateService);

    private readonly idSalon = signal<string | null>(null);

    readonly isMobile = toSignal(
        this.breakpointObserver.observe('(max-width: 991.98px)').pipe(map(state => state.matches)),
        {initialValue: false}
    );

    readonly configDialogVisible = model(false);
    readonly showConfirmDeleteDay = signal(false);

    readonly viewOptions: SwitchBoxOption[] = [
        {value: 'both', icon: 'pi pi-window-maximize', labelKey: 'planningVolunteers.view.both'},
        {value: 'person', icon: 'pi pi-user', labelKey: 'planningVolunteers.view.persons'},
        {value: 'zone', icon: 'pi pi-th-large', labelKey: 'planningVolunteers.view.zones'}
    ];

    readonly plannedHoursLabel = computed(() => formatHours(this.store.stats().plannedHours));

    readonly focusedVolunteerLabel = computed(() => {
        const id = this.store.focusVolunteerId();
        return this.store.planning().volunteers.find(v => v.id === id)?.label ?? '';
    });

    readonly cardActions = computed<EntityAction[]>(() => {
        if (this.store.isReadOnly()) {
            return this.store.downloadMenuItems().map(action => ({...action, disabled: action.disabled || this.store.isLoading()}));
        }
        return [
            {
                labelKey: 'planningVolunteers.manageDay',
                icon: 'pi pi-cog',
                run: () => this.openConfig()
            }
        ];
    });

    readonly dayMenus = computed(() => new Map(this.store.days().map(d => [d.id, this.dayActionItems()])));
    readonly dayTabs = computed<AppTab[]>(() => this.store.dayOptions().map(d => ({key: d.id, label: d.label})));
    readonly subtitle = computed(() => this.navigationStateService.currentSalonPlace(this.idSalon()));

    ngOnInit(): void {
        this.activatedRoute.paramMap
            .pipe(map(params => params.get('idSalon')!))
            .subscribe(idSalon => {
                this.idSalon.set(idSalon);
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
        const idSalon = this.idSalon();
        if (idSalon) {
            this.store.load(idSalon);
        }
    }

    save(): void {
        this.store.save(() => this.store.activateReadOnlyMode());
    }

    // ---------- jours ----------

    selectDay(dayId: string): void {
        this.store.selectDay(dayId);
    }

    openConfig(): void {
        this.configDialogVisible.set(true);
    }

    onConfigConfirm(planning: Planning): void {
        this.store.applyConfig(planning);
        this.configDialogVisible.set(false);
    }

    openDeleteDayConfirm(): void {
        this.showConfirmDeleteDay.set(true);
    }

    confirmDeleteSelectedDay(): void {
        this.store.deleteSelectedDay();
        this.showConfirmDeleteDay.set(false);
    }

    // ---------- vue ----------

    setViewMode(value: string): void {
        const mode = value as ViewMode;
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
        if (this.configDialogVisible() || this.showConfirmDeleteDay()) {
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
                label: this.translate.instant('planningVolunteers.config.title'),
                icon: 'pi pi-cog',
                command: () => this.openConfig()
            },
            {
                label: this.translate.instant('planningVolunteers.deleteDay'),
                icon: 'pi pi-trash',
                styleClass: 'p-menuitem-danger',
                command: () => this.openDeleteDayConfirm()
            }
        ];
    }
}
