import {computed, inject, Injectable, signal} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {finalize} from 'rxjs';

import {
    Category,
    computeTimeSlots,
    Day,
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
    planningFromDto,
    Run,
    SLOT_WIDTH,
    volunteerHours
} from './volunteer-planning-utils';
import {
    PlanningVolunteersDto,
    VolunteerPlanningConfigurationDto,
    VolunteerPlanningService
} from '../volunteer-planning.service';
import {ActionsService} from '../../common/actions.service';
import {AlertService} from '../../../core/util/alert.service';
import {VolunteerRegistrationAdminService} from '../volunteer-registration-admin.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {EntityAction} from '../../../shared/components/entity-list/entity-list.model';
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
    readonly downloadMenuItems = signal<EntityAction[]>([]);
    /** Ids (planningVolunteerId) des bénévoles inscrits en ligne : pour l'icône popin. */
    readonly onlineVolunteerIds = signal<Set<string>>(new Set());
    /** Bénévole dont la popin d'infos en ligne est ouverte (null = fermée). */
    readonly infoVolunteerId = signal<string | null>(null);

    private readonly volunteerPlanningService = inject(VolunteerPlanningService);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private readonly alertService = inject(AlertService);
    private readonly volunteerRegistrationAdminService = inject(VolunteerRegistrationAdminService);
    private idSalon = '';

    get salonId(): string {
        return this.idSalon;
    }

    isOnlineVolunteer(volunteerId: string): boolean {
        return this.onlineVolunteerIds().has(volunteerId);
    }

    openVolunteerInfo(volunteerId: string): void {
        this.infoVolunteerId.set(volunteerId);
    }

    closeVolunteerInfo(): void {
        this.infoVolunteerId.set(null);
    }

    refreshOnlineVolunteerIds(): void {
        if (!this.idSalon) {
            return;
        }
        this.volunteerRegistrationAdminService.getActivePlanningVolunteerIds(this.idSalon)
            .subscribe(ids => this.onlineVolunteerIds.set(new Set(ids)));
    }

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
                this.refreshOnlineVolunteerIds();
                onLoaded?.();
            });
    }

    save(onSaved?: () => void): void {
        const planning = this.planning();
        const payload: PlanningVolunteersDto = {
            version: planning.version,
            configuration: this.toPlanningConfigurationDto(planning),
            volunteers: planning.volunteers.map(v => ({id: v.id, label: v.label}))
        };

        this.isLoading.set(true);
        this.volunteerPlanningService.savePlanningVolunteers(this.idSalon, payload)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (saved: PlanningVolunteersDto) => {
                    // Met à jour la version locale pour permettre d'autres enregistrements successifs.
                    this.planning.update(p => ({...p, version: saved?.version ?? p.version}));
                    this.history.set([]);
                    onSaved?.();
                },
                error: (err: HttpErrorResponse) => {
                    if (err.status === 409) {
                        this.alertService.addAlert({
                            type: 'danger',
                            translationKey: 'planningVolunteers.conflict'
                        });
                    }
                }
            });
    }

    loadDownloadActions(): void {
        if (!this.idSalon) {
            return;
        }
        this.actionsService.getAvailableActions('salon', this.idSalon, 'volunteer-planning')
            .subscribe(actions => {
                this.downloadMenuItems.set(
                    this.menuItemBuilderService.buildEntityActionsFromActions(actions, action => this.clickDownloadAction(action))
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

    // ---------- configuration ----------

    /**
     * Applique en une seule fois l'ensemble de la configuration (bénévoles, catégories et
     * jours avec leur attribution), depuis le dialogue de configuration unique.
     * Purge de cohérence : cells / unavailable / needs / assignations sont filtrés sur les
     * bénévoles et catégories conservés, ainsi que sur les créneaux encore valides.
     */
    applyConfig(planning: Planning): void {
        const current = this.planning();
        const keptVolunteers = new Set(planning.volunteers.map(v => v.id));
        const keptCategories = new Set(planning.categories.map(c => c.id));

        const days = planning.days.map(day => {
            const validSlotCount = computeTimeSlots(day.startTime, day.endTime, day.intervalMinutes).length;
            const assigned = (day.assignedVolunteerIds ?? []).filter(id => keptVolunteers.has(id));
            const assignedSet = new Set(assigned);
            return {
                ...day,
                assignedVolunteerIds: assigned,
                cells: (day.cells ?? []).filter(c =>
                    assignedSet.has(c.volunteerId) && keptCategories.has(c.categoryId) && c.slotIndex < validSlotCount),
                unavailableCells: (day.unavailableCells ?? []).filter(c =>
                    assignedSet.has(c.volunteerId) && c.slotIndex < validSlotCount),
                needs: (day.needs ?? []).filter(n =>
                    keptCategories.has(n.categoryId) && n.slotIndex < validSlotCount)
            };
        });

        this.planning.set({
            version: current.version,
            volunteers: planning.volunteers,
            categories: planning.categories,
            days
        });

        if (!days.some(d => d.id === this.selectedDayId())) {
            this.selectedDayId.set(days[0]?.id ?? '');
        }
        this.history.set([]);
        this.resetTransientState();

        const tool = this.tool();
        if (tool.kind === 'CATEGORY' && !keptCategories.has(tool.categoryId)) {
            this.selectDefaultTool();
        }
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

    // ---------- mapping DTO ----------

    private toPlanningConfigurationDto(planning: Planning): VolunteerPlanningConfigurationDto {
        return {
            categories: planning.categories.map(c => ({
                id: c.id,
                label: c.label,
                icon: c.icon,
                color: c.color,
                description: c.description
            })),
            days: planning.days.map(d => ({
                id: d.id,
                label: d.label,
                date: d.date,
                description: d.description,
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
        return planningFromDto(dto);
    }
}

