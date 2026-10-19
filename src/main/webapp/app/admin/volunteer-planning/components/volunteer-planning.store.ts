import {computed, inject, Injectable, signal} from '@angular/core';
import {finalize} from 'rxjs';

import {
    Category,
    computeTimeSlots,
    Day,
    IntervalMinutes,
    Planning,
    TimeSlot,
    Tool,
    Volunteer
} from './volunteer-planning-model';
import {
    buildCellMap,
    buildUnavailableSet,
    cellKey,
    computeRuns,
    coverage,
    CoverageState,
    dayStats,
    getNeed,
    NAME_COLUMN_WIDTH,
    Run,
    SLOT_WIDTH,
    volunteerHours
} from './volunteer-planning-utils';
import {AssignmentsSlice, DayConfigSlice} from './volunteer-planning-slices';
import {
    PlanningVolunteersDto,
    VolunteerPlanningConfigurationDto,
    VolunteerPlanningService
} from '../volunteer-planning.service';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';

export type ViewMode = 'both' | 'person' | 'zone';
export type MobileView = 'person' | 'zone';

export type ZoneSelection = {
    categoryId: string;
    start: number;
    end: number; // inclusif
    anchor: number;
};

export type CoverageCell = { assigned: number; min: number; state: CoverageState };

const HISTORY_LIMIT = 60;

@Injectable()
export class VolunteerPlanningStore {
    readonly planning = signal<Planning>({volunteers: [], categories: [], days: []});
    readonly selectedDayId = signal<string>('');
    readonly isReadOnly = signal<boolean>(true);
    readonly isLoading = signal<boolean>(false);

    readonly viewMode = signal<ViewMode>('both');
    readonly mobileView = signal<MobileView>('person');
    readonly tool = signal<Tool>({kind: 'NONE'});
    readonly focusVolunteerId = signal<string | null>(null);
    readonly zoneSelection = signal<ZoneSelection | null>(null);
    readonly blockSelection = signal<Run | null>(null);
    readonly editMinimums = signal<boolean>(false);
    readonly mobilePaintMode = signal<boolean>(false);
    readonly history = signal<Day[]>([]);
    readonly downloadMenuItems = signal<AppMenuItem[]>([]);

    private readonly volunteerPlanningService = inject(VolunteerPlanningService);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private idSalon = '';

    // ---------- computed ----------

    readonly days = computed<Day[]>(() => this.planning().days);
    readonly categories = computed<Category[]>(() => this.planning().categories);
    readonly categoryMap = computed(() => new Map(this.categories().map(c => [c.id, c])));
    readonly dayOptions = computed(() => this.days().map(d => ({id: d.id, label: d.label})));

    readonly selectedDay = computed<Day | null>(() => {
        const days = this.days();
        if (!days.length) {
            return null;
        }
        const id = this.selectedDayId();
        return days.find(d => d.id === id) ?? days[0];
    });

    readonly timeSlots = computed<TimeSlot[]>(() => {
        const day = this.selectedDay();
        return day ? computeTimeSlots(day.startTime, day.endTime, day.intervalMinutes) : [];
    });

    readonly slotCount = computed<number>(() => this.timeSlots().length);

    /** Largeur d'un créneau, fixe, partagée par la timeline, les zones et les lignes de couverture. */
    readonly slotW = signal<number>(SLOT_WIDTH).asReadonly();

    readonly trackWidth = computed<number>(() => this.slotCount() * this.slotW());

    readonly totalWidth = computed<number>(() => NAME_COLUMN_WIDTH + this.trackWidth());

    /** Valeur CSS prête à l'emploi pour `--vp-slot-w`. */
    readonly slotWCss = computed<string>(() => `${this.slotW()}px`);

    readonly visibleVolunteers = computed<Volunteer[]>(() => {
        const day = this.selectedDay();
        if (!day) {
            return [];
        }
        const assigned = new Set(day.assignedVolunteerIds ?? []);
        return this.planning().volunteers.filter(v => assigned.has(v.id));
    });

    readonly cellMap = computed(() => {
        const day = this.selectedDay();
        return day ? buildCellMap(day) : new Map<string, string>();
    });

    readonly unavailableSet = computed(() => {
        const day = this.selectedDay();
        return day ? buildUnavailableSet(day) : new Set<string>();
    });

    readonly runsByVolunteer = computed<Map<string, Run[]>>(() => {
        const day = this.selectedDay();
        const m = new Map<string, Run[]>();
        if (!day) {
            return m;
        }
        const count = this.slotCount();
        for (const v of this.visibleVolunteers()) {
            m.set(v.id, computeRuns(day, v.id, count));
        }
        return m;
    });

    readonly hoursByVolunteer = computed<Map<string, number>>(() => {
        const day = this.selectedDay();
        const m = new Map<string, number>();
        if (!day) {
            return m;
        }
        for (const v of this.visibleVolunteers()) {
            m.set(v.id, volunteerHours(day, v.id));
        }
        return m;
    });

    /** categoryId -> tableau indexé par slot. */
    readonly coverageMatrix = computed<Map<string, CoverageCell[]>>(() => {
        const day = this.selectedDay();
        const count = this.slotCount();
        const result = new Map<string, CoverageCell[]>();
        for (const cat of this.categories()) {
            result.set(cat.id, Array.from({length: count}, (): CoverageCell => ({assigned: 0, min: 0, state: 'none'})));
        }
        if (!day) {
            return result;
        }

        const cells = this.cellMap();
        const unav = this.unavailableSet();
        for (const v of (day.assignedVolunteerIds ?? [])) {
            for (let i = 0; i < count; i++) {
                const key = cellKey(v, i);
                if (unav.has(key)) {
                    continue;
                }
                const catId = cells.get(key);
                const arr = catId ? result.get(catId) : undefined;
                if (arr) {
                    arr[i].assigned++;
                }
            }
        }
        for (const need of (day.needs ?? [])) {
            const arr = result.get(need.categoryId);
            if (arr && need.slotIndex < count) {
                arr[need.slotIndex].min = need.min;
            }
        }
        for (const arr of result.values()) {
            for (const cell of arr) {
                cell.state = coverage(cell.assigned, cell.min);
            }
        }
        return result;
    });

    /** Bénévoles affectés par catégorie et par créneau. */
    readonly zoneOccupancy = computed<Map<string, string[][]>>(() => {
        const day = this.selectedDay();
        const count = this.slotCount();
        const result = new Map<string, string[][]>();
        for (const cat of this.categories()) {
            result.set(cat.id, Array.from({length: count}, () => [] as string[]));
        }
        if (!day) {
            return result;
        }
        const cells = this.cellMap();
        const unav = this.unavailableSet();
        for (const v of (day.assignedVolunteerIds ?? [])) {
            for (let i = 0; i < count; i++) {
                const key = cellKey(v, i);
                if (unav.has(key)) {
                    continue;
                }
                const catId = cells.get(key);
                const arr = catId ? result.get(catId) : undefined;
                if (arr) {
                    arr[i].push(v);
                }
            }
        }
        return result;
    });

    /** Nombre de bénévoles libres par créneau. */
    readonly freeBySlot = computed<number[]>(() => {
        const day = this.selectedDay();
        const count = this.slotCount();
        const out = new Array<number>(count).fill(0);
        if (!day) {
            return out;
        }
        const cells = this.cellMap();
        const unav = this.unavailableSet();
        for (const v of (day.assignedVolunteerIds ?? [])) {
            for (let i = 0; i < count; i++) {
                const key = cellKey(v, i);
                if (!cells.has(key) && !unav.has(key)) {
                    out[i]++;
                }
            }
        }
        return out;
    });

    readonly stats = computed(() => {
        const day = this.selectedDay();
        return day ? dayStats(day, this.categories()) : {coveragePct: 100, missingPlaces: 0, plannedHours: 0};
    });

    readonly canUndo = computed(() => this.history().length > 0);

    readonly daySlice = computed<DayConfigSlice>(() => {
        const day = this.selectedDay();
        return {day: day ?? this.createEmptyDay('')};
    });

    readonly assignmentsSlice = computed<AssignmentsSlice>(() => {
        const day = this.selectedDay();
        return {
            dayId: day?.id ?? '',
            dayLabel: day?.label ?? '',
            volunteers: this.planning().volunteers,
            assignedVolunteerIds: day?.assignedVolunteerIds ?? []
        };
    });

    // ---------- chargement / sauvegarde ----------

    load(idSalon: string, onLoaded?: () => void): void {
        this.idSalon = idSalon;
        this.isLoading.set(true);
        this.volunteerPlanningService.getPlanningVolunteers(idSalon)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe((dto: PlanningVolunteersDto | null) => {
                if (dto) {
                    const planning = this.fromPlanningVolunteersDto(dto);
                    this.planning.set(planning);
                    if (!planning.days.some(d => d.id === this.selectedDayId())) {
                        this.selectedDayId.set(planning.days[0]?.id ?? '');
                    }
                } else {
                    this.planning.set({volunteers: [], categories: [], days: []});
                    this.selectedDayId.set('');
                }
                this.resetTransientState();
                this.selectDefaultTool();
                this.loadDownloadActions();
                onLoaded?.();
            });
    }

    save(onSaved?: () => void): void {
        const planning = this.planning();
        const payload: PlanningVolunteersDto = {
            configuration: this.toPlanningConfigurationDto(planning),
            volunteers: planning.volunteers.map(v => ({id: v.id, label: v.label}))
        };

        this.isLoading.set(true);
        this.volunteerPlanningService.savePlanningVolunteers(this.idSalon, payload)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(() => {
                this.history.set([]);
                onSaved?.();
            });
    }

    loadDownloadActions(): void {
        if (!this.idSalon) {
            return;
        }
        this.actionsService.getAvailableActions('salon', this.idSalon, 'volunteer-planning')
            .subscribe(actions => {
                this.downloadMenuItems.set(
                    this.menuItemBuilderService.buildMenuItemsFromActions(actions, action => this.clickDownloadAction(action))
                );
            });
    }

    clickDownloadAction(action: AvailableAction): void {
        if (action.type !== 'DOWNLOAD') {
            return;
        }
        this.isLoading.set(true);
        this.actionsService.downloadAction(action.contextCode, this.idSalon)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(res => {
                const cd = res.headers.get('content-disposition') ?? '';
                const filename = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '')
                    ?? 'planning-benevoles.pdf';
                const url = window.URL.createObjectURL(res.body!);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
            });
    }

    // ---------- mutations ----------

    /** Point d'entrée unique des mutations du jour courant. */
    updateDay(fn: (day: Day) => Day, recordHistory = true): void {
        if (this.isReadOnly()) {
            return;
        }
        const planning = this.planning();
        const index = planning.days.findIndex(d => d.id === this.selectedDay()?.id);
        if (index < 0) {
            return;
        }
        const current = planning.days[index];
        const next = fn(current);
        if (next === current) {
            return;
        }
        if (recordHistory) {
            this.pushHistory(current);
        }
        const days = [...planning.days];
        days[index] = next;
        this.planning.set({...planning, days});
    }

    private pushHistory(day: Day): void {
        const history = [...this.history(), day];
        if (history.length > HISTORY_LIMIT) {
            history.shift();
        }
        this.history.set(history);
    }

    undo(): boolean {
        const history = [...this.history()];
        const previous = history.pop();
        if (!previous) {
            return false;
        }
        this.history.set(history);

        const planning = this.planning();
        const index = planning.days.findIndex(d => d.id === previous.id);
        if (index < 0) {
            return false;
        }
        const days = [...planning.days];
        days[index] = previous;
        this.planning.set({...planning, days});
        this.blockSelection.set(null);
        return true;
    }

    selectDay(dayId: string): void {
        if (dayId === this.selectedDayId()) {
            return;
        }
        this.selectedDayId.set(dayId);
        this.history.set([]);
        this.resetTransientState();
    }

    activateEditMode(): void {
        this.isReadOnly.set(false);
        this.history.set([]);
        this.resetTransientState();
        this.selectDefaultTool();
    }

    activateReadOnlyMode(): void {
        this.isReadOnly.set(true);
        this.history.set([]);
        this.resetTransientState();
    }

    resetTransientState(): void {
        this.zoneSelection.set(null);
        this.blockSelection.set(null);
        this.editMinimums.set(false);
    }

    selectDefaultTool(): void {
        const first = this.categories()[0];
        this.tool.set(first ? {kind: 'CATEGORY', categoryId: first.id} : {kind: 'ERASER'});
    }

    toggleFocus(volunteerId: string): void {
        this.focusVolunteerId.set(this.focusVolunteerId() === volunteerId ? null : volunteerId);
    }

    getNeed(categoryId: string, slot: number): number {
        const day = this.selectedDay();
        return day ? getNeed(day, categoryId, slot) : 0;
    }

    // ---------- dialogs ----------

    applyVolunteers(volunteers: Volunteer[]): void {
        const current = this.planning();
        const kept = new Set(volunteers.map(v => v.id));
        const days = current.days.map(d => ({
            ...d,
            assignedVolunteerIds: d.assignedVolunteerIds.filter(id => kept.has(id)),
            cells: d.cells.filter(c => kept.has(c.volunteerId)),
            unavailableCells: (d.unavailableCells ?? []).filter(c => kept.has(c.volunteerId))
        }));
        this.planning.set({...current, volunteers, days});
        this.resetTransientState();
    }

    applyCategories(categories: Category[]): void {
        const current = this.planning();
        const kept = new Set(categories.map(c => c.id));
        const days = current.days.map(d => ({
            ...d,
            cells: d.cells.filter(cell => kept.has(cell.categoryId)),
            needs: (d.needs ?? []).filter(n => kept.has(n.categoryId))
        }));
        this.planning.set({...current, categories, days});
        this.resetTransientState();

        const tool = this.tool();
        if (tool.kind === 'CATEGORY' && !kept.has(tool.categoryId)) {
            this.selectDefaultTool();
        }
    }

    applyDaySlice(slice: DayConfigSlice): void {
        const current = this.planning();
        const index = current.days.findIndex(d => d.id === slice.day.id);
        if (index < 0) {
            return;
        }

        const updated: Day = {
            ...slice.day,
            cells: [...(slice.day.cells ?? [])],
            unavailableCells: [...(slice.day.unavailableCells ?? [])],
            needs: [...(slice.day.needs ?? [])]
        };
        const validSlotCount = computeTimeSlots(updated.startTime, updated.endTime, updated.intervalMinutes).length;
        updated.cells = updated.cells.filter(c => c.slotIndex < validSlotCount);
        updated.unavailableCells = updated.unavailableCells.filter(c => c.slotIndex < validSlotCount);
        updated.needs = updated.needs.filter(n => n.slotIndex < validSlotCount);

        const days = [...current.days];
        days[index] = updated;
        this.planning.set({...current, days});
        this.resetTransientState();
    }

    applyAssignmentsSlice(slice: AssignmentsSlice): void {
        const current = this.planning();
        const index = current.days.findIndex(d => d.id === slice.dayId);
        if (index < 0) {
            return;
        }
        const day = current.days[index];
        const kept = new Set(slice.assignedVolunteerIds);
        const days = [...current.days];
        days[index] = {
            ...day,
            assignedVolunteerIds: [...kept],
            cells: day.cells.filter(c => kept.has(c.volunteerId)),
            unavailableCells: (day.unavailableCells ?? []).filter(c => kept.has(c.volunteerId))
        };
        this.planning.set({...current, days});
        this.resetTransientState();
    }

    addDay(day: Day): void {
        const current = this.planning();
        this.planning.set({...current, days: [...current.days, day]});
        this.selectedDayId.set(day.id);
        this.history.set([]);
        this.resetTransientState();
    }

    deleteSelectedDay(): void {
        const dayId = this.selectedDay()?.id;
        if (!dayId) {
            return;
        }
        const current = this.planning();
        const days = current.days.filter(d => d.id !== dayId);
        this.planning.set({...current, days});
        this.selectedDayId.set(days[0]?.id ?? '');
        this.history.set([]);
        this.resetTransientState();
    }

    createEmptyDay(id: string): Day {
        return {
            id,
            label: '',
            startTime: timeAt(8, 0),
            endTime: timeAt(18, 0),
            intervalMinutes: 60,
            assignedVolunteerIds: [],
            cells: [],
            unavailableCells: [],
            needs: []
        };
    }

    // ---------- mapping DTO ----------

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
                })),
                unavailableCells: (d.unavailableCells ?? []).map(c => ({
                    volunteerId: c.volunteerId,
                    slotIndex: c.slotIndex
                })),
                needs: (d.needs ?? [])
                    .filter(n => n.min > 0)
                    .map(n => ({categoryId: n.categoryId, slotIndex: n.slotIndex, min: n.min}))
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
                cells: d.cells ?? [],
                unavailableCells: d.unavailableCells ?? [],
                needs: d.needs ?? []
            }))
        };
    }
}

export function timeAt(h: number, m: number): Date {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}
