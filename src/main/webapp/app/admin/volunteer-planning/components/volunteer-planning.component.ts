import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, HostListener, inject, model, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';

import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {DividerModule} from 'primeng/divider';
import {DatePickerModule} from 'primeng/datepicker';
import {SelectModule} from 'primeng/select';
import {DialogModule} from 'primeng/dialog';
import {ConfirmPopup} from 'primeng/confirmpopup';


import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';

import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {TranslateModule} from '@ngx-translate/core';

import {Category, computeTimeSlots, Day, IntervalMinutes, Planning, TimeSlot, Tool, Volunteer} from './volunteer-planning-model';

import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'primeng/tabs';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {MenuItem} from 'primeng/api';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {CategoryManagerComponent} from './category-manager/category-manager.component';
import {SelectedDayAssignmentsComponent} from './selected-day-assignments/selected-day-assignments.component';
import {VolunteerManagerComponent} from './volunteer-manager/volunteer-manager.component';
import {SelectedDayEditorComponent} from './selected-day-editor/selected-day-editor.component';
import {AssignmentsSlice, DayConfigSlice} from './volunteer-planning-slices';
import {
    PlanningVolunteersDto,
    VolunteerPlanningConfigurationDto,
    VolunteerPlanningService
} from '../volunteer-planning.service';
import {finalize, map} from 'rxjs';

@Component({
               selector: 'app-volunteer-planning',
               standalone: true,
               imports: [
                   CommonModule,
                   FormsModule,
                   TableModule,
                   ButtonModule,
                   DividerModule,
                   DatePickerModule,
                   SelectModule,
                   DialogModule,
                   ConfirmPopup,
                   
                   ContentPageComponent,
                   TranslateModule,
                   ButtonBoxComponent,
                   
                   AlertErrorComponent,
                   CardComponent,
                   TabPanels,
                   TabList,
                   Tabs,
                   Tab,
                   MenuBoxComponent,
                   DialogBoxComponent,
                   CategoryManagerComponent,
                   SelectedDayAssignmentsComponent,
                   VolunteerManagerComponent,
                   SelectedDayEditorComponent,
                   TabPanel
               ],
               templateUrl: './volunteer-planning.component.html',
               styleUrls: ['./volunteer-planning.component.scss'],
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class VolunteerPlanningComponent implements OnInit {
    planning = signal<Planning>(this.getEmptyPlanning());
    selectedDayId = signal<string>(this.planning().days[0]?.id ?? '');
    readonly isLoading = signal<boolean>(false);
    readonly isReadOnly = signal<boolean>(true);
    readonly dayMenus = computed(() => new Map(this.planning().days.map(d => [d.id, this.dayActionItems()])));

    private readonly volunteerPlanningService = inject(VolunteerPlanningService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private idSalon: string = '';

    // ...existing code...

    ngOnInit(): void {
        this.activatedRoute.paramMap
            .pipe(
                map(params => params.get('idSalon')!)
            )
            .subscribe(idSalon => {
                this.idSalon = idSalon;
                this.isLoading.set(true);
                this.volunteerPlanningService.getPlanningVolunteers(idSalon)
                    .pipe(finalize(() => this.isLoading.set(false)))
                    .subscribe(
                        (dto: PlanningVolunteersDto | null) => {
                            if (dto) {
                                this.planning.set(this.fromPlanningVolunteersDto(dto));
                                this.selectedDayId.set(this.planning().days[0]?.id ?? '');
                            } else {
                                this.planning.set(this.getEmptyPlanning());
                            }
                        }
                    );
            });
    }

    // ✅ Nouveau : tool = categoryId, plus TaskCategory
    selectedTool = signal<Tool>({kind: 'NONE'});
    painting = signal(false);

    // ✅ Dialog pour ton panel (admin)
    dayDialogVisible = model(false);
    volunteersDialogVisible = model(false);
    assignmentsDialogVisible = model(false);
    categoriesDialogVisible = model(false);
    showConfirmDeleteDay = signal(false);
    manageDayCreateMode = signal(false);
    manageDaySelectedDayId = signal<string>('');

    // ---------- computed ----------
    dayOptions = computed(() => this.planning().days.map(d => ({id: d.id, label: d.label})));
    selectedDay = computed(() => {
        const days = this.planning().days;
        if (!days.length) {
            return null;
        }

        const id = this.selectedDayId();
        return this.planning().days.find(d => d.id === id) ?? this.planning().days[0];
    });

    daySlice = computed<DayConfigSlice>(() => {
        // Mode création - retourner un jour vide avec l'ID généré
        if (this.manageDayCreateMode()) {
            const newDayId = this.manageDaySelectedDayId();
            return {
                day: {
                    id: newDayId,
                    label: '',
                    startTime: this.timeAt(8, 0),
                    endTime: this.timeAt(18, 0),
                    intervalMinutes: 60,
                    assignedVolunteerIds: [],
                    cells: []
                }
            };
        }

        const day = this.selectedDay();
        const days = this.planning().days;
        if (!day && (!days || days.length === 0)) {
            // Return empty/fallback slice
            return {
                day: {
                    id: '',
                    label: '',
                    startTime: new Date(),
                    endTime: new Date(),
                    intervalMinutes: 60,
                    assignedVolunteerIds: [],
                    cells: []
                }
            };
        }
        // fallback propre
        const safeDay: Day = day ?? (days && days.length > 0 ? days[0] : {
            id: '',
            label: '',
            startTime: new Date(),
            endTime: new Date(),
            intervalMinutes: 60,
            assignedVolunteerIds: [],
            cells: []
        });
        return {
            day: safeDay
        };
    });

    activateReadOnlyMode(): void {
        this.isReadOnly.set(true);
        this.ngOnInit();
    }

    activateEditMode(): void {
        this.isReadOnly.set(false);
    }

    save(): void {
        const payload: PlanningVolunteersDto = {
            configuration: this.toPlanningConfigurationDto(this.planning()),
            volunteers: this.planning().volunteers.map(v => ({id: v.id, label: v.label}))
        };

        this.isLoading.set(true);
        this.volunteerPlanningService
            .savePlanningVolunteers(this.idSalon, payload)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(() => {
                this.activateReadOnlyMode();
            });
    }

    assignmentsSlice = computed<AssignmentsSlice>(() => {
        const day = this.selectedDay();
        const days = this.planning().days;
        const safeDay = day ?? (days && days.length > 0 ? days[0] : null);
        return {
            dayId: safeDay?.id ?? '',
            dayLabel: safeDay?.label ?? '',
            volunteers: this.planning().volunteers,
            assignedVolunteerIds: safeDay?.assignedVolunteerIds ?? []
        };
    });

    timeSlots = computed<TimeSlot[]>(() => {
        const day = this.selectedDay();
        if (!day) {
            return [];
        }
        return computeTimeSlots(day.startTime, day.endTime, day.intervalMinutes);
    });

    // ----- APPLY (confirm only) -----

    applyVolunteers(volunteers: Volunteer[]) {
        // nettoyage: retirer volunteerId des assignations + cells dans tous les jours
        const cur = this.planning();
        const keptIds = new Set(volunteers.map(v => v.id));

        const days = cur.days.map(d => ({
            ...d,
            assignedVolunteerIds: d.assignedVolunteerIds.filter(id => keptIds.has(id)),
            cells: d.cells.filter(c => keptIds.has(c.volunteerId))
        }));

        this.planning.set({...cur, volunteers, days});
    }

    applyCategories(categories: Category[]) {
        // nettoyage: enlever les cellules qui utilisent une catégorie supprimée
        const cur = this.planning();
        const kept = new Set(categories.map(c => c.id));

        const days = cur.days.map(d => ({
            ...d,
            cells: d.cells.filter(cell => kept.has(cell.categoryId))
        }));

        this.planning.set({...cur, categories, days});
    }

    applyDaySlice(slice: DayConfigSlice) {
        const cur = this.planning();

        // maj du jour (par id)
        const idx = cur.days.findIndex(d => d.id === slice.day.id);
        if (idx >= 0) {
            const updatedDay = structuredClone(slice.day);
            // nettoyage silencieux des cellules dont le slotIndex dépasse le nouveau nombre de slots
            const validSlotCount = computeTimeSlots(updatedDay.startTime, updatedDay.endTime, updatedDay.intervalMinutes).length;
            updatedDay.cells = updatedDay.cells.filter(c => c.slotIndex < validSlotCount);

            const days = [...cur.days];
            days[idx] = updatedDay;
            this.planning.set({...cur, days});
        }
    }

    applyAssignmentsSlice(slice: AssignmentsSlice) {
        const cur = this.planning();
        const idx = cur.days.findIndex(d => d.id === slice.dayId);
        if (idx < 0) {
            return;
        }

        // nettoyage: si un bénévole est désassigné, supprimer ses cells du jour
        const day = cur.days[idx];
        const set = new Set(slice.assignedVolunteerIds);

        const nextDay: Day = {
            ...day,
            assignedVolunteerIds: [...set],
            cells: day.cells.filter(c => set.has(c.volunteerId))
        };

        const days = [...cur.days];
        days[idx] = nextDay;

        this.planning.set({...cur, days});
    }

    // ✅ map categories by id
    categoryMap = computed(() => new Map(this.planning().categories.map(c => [c.id, c])));
    // Totaux par catégorie : Map<categoryId, number[]> indexé par slotIndex
    categoryTotals = computed<Map<string, number[]>>(() => {
        const day = this.selectedDay();
        const slots = this.timeSlots();
        const categories = this.planning().categories;

        const totals = new Map<string, number[]>();
        for (const cat of categories) {
            totals.set(cat.id, new Array(slots.length).fill(0));
        }

        if (!day) {
            return totals;
        }

        for (const cell of day.cells) {
            const counts = totals.get(cell.categoryId);
            if (counts && cell.slotIndex < counts.length) {
                counts[cell.slotIndex]++;
            }
        }
        return totals;
    });

    // ✅ cellMap: key => categoryId
    cellMap = computed(() => {
        const day = this.selectedDay();
        const m = new Map<string, string>();
        if (!day) {
            return m;
        }
        for (const c of day.cells) {
            m.set(this.cellKey(c.volunteerId, c.slotIndex), c.categoryId);
        }
        return m;
    });
    // ✅ volunteers visibles : si le jour a des assignations, on filtre
    visibleVolunteers = computed<Volunteer[]>(() => {
        const day = this.selectedDay();
        const all = this.planning().volunteers;
        if (!day) {
            return [];
        }

        const assigned = day.assignedVolunteerIds ?? [];
        const set = new Set(assigned);
        return all.filter(v => set.has(v.id));
    });
    private lastKey: string | null = null;
    // perf: rAF throttle optionnel
    private rafId: number | null = null;
    private pendingPaint: { vId: string; slot: number } | null = null;

    // ---------- Palette ----------
    selectEraser() {
        this.selectedTool.set({kind: 'ERASER'});
    }

    selectCategory(categoryId: string) {
        this.selectedTool.set({kind: 'CATEGORY', categoryId});
    }

    isSelectedCategory(categoryId: string) {
        const t = this.selectedTool();
        return t.kind === 'CATEGORY' && t.categoryId === categoryId;
    }

    // ---------- Grid paint ----------
    getCategoryId(volunteerId: string, slotIndex: number): string | null {
        return this.cellMap().get(this.cellKey(volunteerId, slotIndex)) ?? null;
    }

    uiFor(categoryId: string | null): Category | null {
        if (!categoryId) {
            return null;
        }
        return this.categoryMap().get(categoryId) ?? null;
    }

    startPaint(volunteerId: string, slotIndex: number, ev: PointerEvent): void {
        if (this.isReadOnly()) {
            return;
        }

        if (ev.pointerType === 'mouse' && ev.button !== 0) {
            return;
        }

        this.painting.set(true);
        this.lastKey = `${volunteerId}-${slotIndex}`;

        // applique tout de suite
        this.applyTool(volunteerId, slotIndex);

        // capture seulement touch/pen
        if (ev.pointerType !== 'mouse') {
            const target = ev.currentTarget as HTMLElement | null;
            if (target?.setPointerCapture) {
                try {
                    target.setPointerCapture(ev.pointerId);
                } catch {
                }
            }
        }

        ev.preventDefault();
    }

    onPaintMove(ev: PointerEvent): void {
        if (!this.painting()) {
            return;
        }

        // strict: uniquement si bouton gauche appuyé
        if (ev.pointerType === 'mouse' && (ev.buttons & 1) === 0) {
            this.stopPaint();
            return;
        }

        const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
        const cell = el?.closest('.paint-cell') as HTMLElement | null;
        if (!cell) {
            return;
        }

        const vIdStr = cell.dataset['volunteerId'];
        const slotStr = cell.dataset['slotIndex'];
        if (vIdStr == null || slotStr == null) {
            return;
        }

        const key = `${vIdStr}-${slotStr}`;
        if (key === this.lastKey) {
            return;
        }
        this.lastKey = key;

        // ✅ throttle (optionnel mais recommandé)
        this.queuePaint(vIdStr, Number(slotStr));
    }

    stopPaint(): void {
        this.painting.set(false);
        this.lastKey = null;

        // cancel throttle
        this.pendingPaint = null;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    applyTool(volunteerId: string, slotIndex: number) {
        if (this.isReadOnly()) {
            return;
        }

        const day = this.selectedDay();
        if (!day) {
            return;
        }

        const tool = this.selectedTool();
        const categoryId: string | null = tool.kind === 'CATEGORY' ? tool.categoryId : null;

        this.setCellCategory(day.id, volunteerId, slotIndex, categoryId);
    }

    openDeleteDayConfirm(): void {
        this.showConfirmDeleteDay.set(true);
    }

    addNewDay(): void {
        this.manageDayCreateMode.set(true);
        this.manageDaySelectedDayId.set(this.generateUUID());
        this.dayDialogVisible.set(true);
    }

    onManageDayConfirm(daySlice: DayConfigSlice): void {
        if (this.manageDayCreateMode()) {
            // Mode création - ajouter le nouveau jour
            const cur = this.planning();
            const newDay: Day = daySlice.day;
            const days = [...cur.days, newDay];

            this.planning.set({...cur, days});

            this.manageDayCreateMode.set(false);
            this.manageDaySelectedDayId.set('');
            this.dayDialogVisible.set(false);
            this.selectedDayId.set(newDay.id);
        } else {
            // Mode édition - mise à jour du jour existant
            this.applyDaySlice(daySlice);
            this.dayDialogVisible.set(false);
        }
    }

    @HostListener('window:pointerup')
    @HostListener('window:pointercancel')
    @HostListener('window:blur')
    onGlobalStop(): void {
        this.stopPaint();
    }

    // ✅ update minimal-copy (perf)
    private setCellCategory(dayId: string, volunteerId: string, slotIndex: number, categoryId: string | null) {
        const cur = this.planning();
        const dayIndex = cur.days.findIndex(d => d.id === dayId);
        if (dayIndex < 0) {
            return;
        }

        const day = cur.days[dayIndex];
        const i = day.cells.findIndex(c => c.volunteerId === volunteerId && c.slotIndex === slotIndex);

        // no-op
        if (categoryId === null && i < 0) {
            return;
        }
        if (categoryId !== null && i >= 0 && day.cells[i].categoryId === categoryId) {
            return;
        }

        const days = [...cur.days];
        const nextDay: Day = {...day};

        const cells = [...day.cells];
        if (categoryId === null) {
            cells.splice(i, 1);
        } else {
            if (i >= 0) {
                cells[i] = {...cells[i], categoryId};
            } else {
                cells.push({volunteerId, slotIndex, categoryId});
            }
        }

        nextDay.cells = cells;
        days[dayIndex] = nextDay;

        this.planning.set({...cur, days});
    }

    confirmDeleteSelectedDay(): void {
        const dayId = this.selectedDay()?.id;
        if (!dayId) {
            return;
        }

        // Remove day
        this.planning.update(planning => ({
            ...planning,
            days: (planning.days ?? []).filter(d => d.id !== dayId)
        }));

        this.showConfirmDeleteDay.set(false);
    }

    previousState(): void {
        window.history.back();
    }

    private toPlanningConfigurationDto(planning: Planning): VolunteerPlanningConfigurationDto {
        return {
            categories: planning.categories.map(c => ({
                id: c.id,
                label: c.label,
                icon: c.icon,
                color: c.color
            })),
            days: planning.days.map(d => ({
                id: d.id,
                label: d.label,
                startTime: d.startTime.toISOString(),
                endTime: d.endTime.toISOString(),
                intervalMinutes: d.intervalMinutes,
                assignedVolunteerIds: d.assignedVolunteerIds ?? [],
                cells: d.cells.map(c => ({
                    volunteerId: c.volunteerId,
                    slotIndex: c.slotIndex,
                    categoryId: c.categoryId
                }))
            }))
        };
    }

    private fromPlanningVolunteersDto(dto: PlanningVolunteersDto): Planning {
        const globalInterval = dto.configuration.intervalMinutes ?? 60;
        return {
            volunteers: dto.volunteers.map(v => ({id: v.id, label: v.label})),
            categories: dto.configuration.categories.map(c => ({
                id: c.id,
                label: c.label,
                icon: c.icon,
                color: c.color
            })),
            days: dto.configuration.days.map(d => ({
                id: d.id,
                label: d.label,
                startTime: new Date(d.startTime),
                endTime: new Date(d.endTime),
                intervalMinutes: (d.intervalMinutes ?? globalInterval) as IntervalMinutes,
                assignedVolunteerIds: d.assignedVolunteerIds ?? [],
                cells: d.cells ?? []
            }))
        };
    }

    private queuePaint(vId: string, slot: number) {
        this.pendingPaint = {vId, slot};
        if (this.rafId !== null) {
            return;
        }

        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            const p = this.pendingPaint;
            this.pendingPaint = null;
            if (!p) {
                return;
            }
            this.applyTool(p.vId, p.slot);
        });
    }

    // ---------- Helpers ----------
    private cellKey(volunteerId: string, slotIndex: number): string {
        return `${volunteerId}::${slotIndex}`;
    }

    private timeAt(h: number, m: number): Date {
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }

    private generateUUID(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    private dayActionItems(): MenuItem[] {
        return [
            {
                label: 'Configuration',
                icon: 'pi pi-calendar',
                command: () => {
                    this.dayDialogVisible.set(true);
                }
            },
            {
                label: 'Assignement des bénévoles',
                icon: 'pi pi-user',
                command: () => {
                    this.assignmentsDialogVisible.set(true);
                }
            },
            {
                label: 'Supprimer le jour',
                icon: 'pi pi-trash',
                styleClass: 'p-menuitem-danger',
                command: () => this.openDeleteDayConfirm()
            }
        ];
    }

    private getEmptyPlanning(): Planning {
        return {
            volunteers: [],
            categories: [],
            days: []
        };
    }

    private makeInitialPlanning(): Planning {
        const volunteers: Volunteer[] = [
            {id: 'v1', label: 'Charlène'},
            {id: 'v2', label: 'Davy'},
            {id: 'v3', label: 'Dylan'},
            {id: 'v4', label: 'Matthias'},
            {id: 'v5', label: 'Raphael'},
            {id: 'v6', label: 'Kevin'},
            {id: 'v7', label: 'Cathy'},
            {id: 'v8', label: 'Leila'},
            {id: 'v9', label: 'Michael'},
            {id: 'v10', label: 'Papa'}
        ];

        const categories: Category[] = [
            {id: 'c1', label: 'Buvette', icon: 'pi pi-credit-card', color: '#C1E1C1'},
            {id: 'c2', label: 'Lavage', icon: 'pi pi-sparkles', color: '#C1D9E1'},
            {id: 'c3', label: 'Cuisine', icon: 'pi pi-shop', color: '#FFDDC1'},
            {id: 'c4', label: 'Logistique', icon: 'pi pi-box', color: '#ffe8b5'},
            {id: 'c5', label: 'Non disponible', icon: 'pi pi-times', color: '#DDDDDD'}
        ];

        return {
            volunteers,
            categories,
            days: [
                {
                    id: 'd1',
                    label: 'Vendredi',
                    startTime: this.timeAt(8, 0),
                    endTime: this.timeAt(19, 0),
                    intervalMinutes: 60,
                    assignedVolunteerIds: [],
                    cells: []
                },
                {
                    id: 'd2',
                    label: 'Samedi',
                    startTime: this.timeAt(8, 0),
                    endTime: this.timeAt(19, 0),
                    intervalMinutes: 60,
                    assignedVolunteerIds: [],
                    cells: []
                }
            ]
        };
    }
}