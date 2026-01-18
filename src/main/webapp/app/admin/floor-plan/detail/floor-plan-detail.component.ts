import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    model,
    signal,
    ViewChild
} from '@angular/core';
import {CdkDragDrop, CdkDragMove, CdkDropList} from '@angular/cdk/drag-drop';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {distinctUntilChanged, filter, finalize, map, startWith} from 'rxjs/operators';
import {combineLatest, forkJoin, fromEvent, Observable} from 'rxjs';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

import SharedModule from '../../../shared/shared.module';
import {CommonModule} from '@angular/common';

import {
    AddPlanInfo,
    convertAvailableDimensionCell,
    convertAvailableDimensionCells,
    DimensionCell,
    getColorStand,
    GridCell,
    IFloorPlan,
    IFloorPlanData,
    mapFloorPlan,
    mapFloorPlanLight
} from '../floor-plan.model';

import {IStand} from '../../stand/model/stand.interface';
import {StandService} from '../../stand/service/stand.service';
import {FloorPlanService} from '../service/floor-plan.service';
import {SalonService} from '../../salon/service/salon.service';
import {ISalon} from '../../salon/model/salon.interface';
import {Status} from '../../enumerations/status.model';
import {v4} from 'uuid';

import {ITEM_ADDED_EVENT, ITEM_DELETED_EVENT, ITEM_UPDATED_EVENT} from '../../../config/navigation.constants';
import {RenamePlanDialogComponent} from '../rename-plan/rename-plan-dialog.component';
import {AddPlanDialogComponent} from '../add-plan/add-plan-dialog.component';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {ConfirmPopup} from 'primeng/confirmpopup';
import {Toast} from 'primeng/toast';
import {ContextMenu} from 'primeng/contextmenu';
import {MenuItem, PrimeIcons} from 'primeng/api';
import {Tag} from 'primeng/tag';
import {Divider} from 'primeng/divider';
import {Textarea} from 'primeng/textarea';
import {IftaLabel} from 'primeng/iftalabel';

import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {AlertComponent} from '../../../shared/alert/alert.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';
import {FloorPlanDimensionTileComponent} from './floor-plan-dimension-tile/floor-plan-dimension-tile.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import ColorStatusPipe from '../../../shared/pipe/color-status.pipe';
import StatusPipe from '../../../shared/pipe/status.pipe';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';

import {getFormattedParticipationName} from '../../participation/model/participation.interface';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {removeAccents} from '../../../shared/utils/string.util';
import {selectFilterExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';

@Component({
               selector: 'floor-plan',
               templateUrl: './floor-plan-detail.component.html',
               styleUrl: './floor-plan-detail.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [
                   SharedModule,
                   CommonModule,
                   RouterModule,
                   CdkDropList,
                   FormsModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   AlertComponent,
                   AlertErrorComponent,
                   ConfirmPopup,
                   Toast,
                   ContextMenu,
                   Tag,
                   FloorPlanDimensionTileComponent,
                   CardComponent,
                   ContentPageComponent,
                   ColorStatusPipe,
                   StatusPipe,
                   Textarea,
                   IftaLabel,
                   DialogBoxComponent,
                   Divider,
                   SelectBoxComponent,
                   TextBoxComponent
               ]
           })
export class FloorPlanDetailComponent {
    @ViewChild('cm', {static: true}) cm!: ContextMenu;
    @ViewChild('gridDropList') gridContainer!: ElementRef<HTMLElement>;

    readonly PIXELS = 20;
    readonly DEFAULT_HIGHLIGHT = '#FFFFFF';

    // ---- services / infra
    private readonly destroyRef = inject(DestroyRef);
    private readonly modalService = inject(NgbModal);
    private readonly salonService = inject(SalonService);
    private readonly standService = inject(StandService);
    private readonly floorPlanService = inject(FloorPlanService);
    readonly navigationService = inject(NavigationStateService);
    private readonly route = inject(ActivatedRoute);

    // ---- route salon (signal)
    private readonly salonFromRoute = toSignal(
        this.route.data.pipe(map(d => d['salon'] as ISalon | undefined)),
        {initialValue: undefined}
    );
    readonly salon = computed(() => this.salonFromRoute() ?? undefined);

    // ---- UI/state (signals)
    readonly isLoading = signal(false);
    readonly isReadOnly = signal(true);

    readonly displayFullname = signal(false);
    readonly displayTechnical = signal(false);
    readonly showDimensions = signal(false);
    readonly showAvailableStands = signal(false);
    readonly showSearchStands = signal(false);
    readonly displayHeader = signal(true);

    readonly isDragging = signal(false);
    private draggingCell: GridCell | null = null;

    readonly idDisplaySensibleInformation = signal<string | null>(null);

    // dialogs (model = 2-way friendly)
    readonly standDialogVisible = model(false);
    readonly prereservedDialogVisible = model(false);
    readonly renameDialogVisible = model(false);

    readonly selectStandDialog = signal<GridCell | null>(null);

    // ---- data (signals)
    readonly floorPlans = signal<IFloorPlan[]>([]);
    readonly activeIndex = signal(0);

    readonly stands = signal<IStand[]>([]);
    readonly availableDimensions = signal<DimensionCell[]>([]);
    readonly unassignedStandDimensions = signal<DimensionCell[]>([]);
    readonly assignedStandDimensions = signal<DimensionCell[]>([]);

    private readonly floorPlansToRemove = signal<string[]>([]);

    // ---- forms (keep as is)
    readonly searchDimensionCell = new FormControl<DimensionCell | null>(null);
    readonly nextPosition = new FormControl<number | null>(1);
    readonly isNumberAttribution = signal(false);
    readonly automaticallyIncrementNumber = signal(true);
    readonly renamePlanName = new FormControl<string>('');

    // ---- derived (computed)
    readonly activePlan = computed(() => this.floorPlans()[this.activeIndex()] ?? null);
    readonly activeData = computed(() => this.activePlan()?.data ?? null);
    readonly activeCells = computed(() => this.activeData()?.cells ?? []);

    readonly sizeRealCell = computed(() => {
        const d = this.activeData();
        return d ? 1 / d.spacingMeter : 0;
    });

    readonly nbWidthTiles = computed(() => {
        const d = this.activeData();
        return d ? d.widthMeter * this.sizeRealCell() : 0;
    });

    readonly nbHeightTiles = computed(() => {
        const d = this.activeData();
        return d ? d.heightMeter * this.sizeRealCell() : 0;
    });

    // context menu
    readonly contextMenuItems = signal<MenuItem[]>([]);

    // prereserved
    prereservedNote: string | null = null;
    private prereservedTargetDimension: DimensionCell | null = null;

    // single/double click
    private clickTimer: any;
    private readonly clickDelay = 220;

    // ---- perf: highlight only previous highlighted cells + rAF throttle
    private highlightedCells: GridCell[] = [];
    private highlightRaf = 0;
    private pendingHighlightEvent: CdkDragMove<any> | null = null;

    // ---- perf: quick lookup for search stand -> plan/cell
    private standIndex = new Map<string, { planIndex: number; dimension: DimensionCell }>();

    // ---- optional: shape index for quick remove/unassign (per active plan)
    private shapeIndex = new Map<string, GridCell[]>();

    // exposed helpers
    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly formatterCategory = formatterCategory;
    protected readonly Category = Category;
    protected readonly Validators = Validators;
    protected readonly formatterStandDimension = formatterStandDimension;
    protected readonly selectFilterStandDimension = selectFilterStandDimension;

    constructor() {
        // keydown (auto cleanup)
        fromEvent<KeyboardEvent>(window, 'keydown')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(e => this.handleKeydown(e));

        // reload when salon changes
        effect(() => {
            const salon = this.salon();
            if (!salon?.id) {
                return;
            }
            this.reloadFromServer(salon.id);
        });

        // rebuild indexes when active plan changes
        effect(() => {
            const data = this.activeData();
            if (!data) {
                return;
            }
            this.rebuildShapeIndex(data);
            this.clearHighlights();
        });

        // search => focus + mark searched (no duplicate subscribe)
        const searchedDim = toSignal(
            this.searchDimensionCell.valueChanges.pipe(
                startWith(this.searchDimensionCell.value),
                distinctUntilChanged((a, b) => (a?.stand?.id ?? null) === (b?.stand?.id ?? null))
            ),
            {initialValue: null}
        );

        effect(() => {
            const dim = searchedDim();
            this.applySearch(dim);
        });
    }

    // ---------------------------------------------------------------------------
    // modes / palette
    resetPalette(): void {
        this.showDimensions.set(false);
        this.showAvailableStands.set(false);
        this.isNumberAttribution.set(false);
        this.automaticallyIncrementNumber.set(true);
    }

    activateReadOnlyMode(): void {
        this.isReadOnly.set(true);
        this.resetPalette();

        const id = this.salon()?.id;
        if (id) {
            this.reloadFromServer(id);
        }
    }

    activateEditMode(): void {
        this.isReadOnly.set(false);
        this.resetPalette();
    }

    // ---------------------------------------------------------------------------
    // loading
    private reloadFromServer(salonId: string): void {
        this.isLoading.set(true);
        this.resetDataState();

        combineLatest([
                          this.standService.query({idSalon: salonId}).pipe(map(r => r ?? [])),
                          this.floorPlanService.load(salonId),
                          this.salonService.getDimensionStands(salonId)
                      ])
            .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
            .subscribe(([stands, floorPlans, dimensionStands]) => {
                this.stands.set(stands);

                const availableDims = convertAvailableDimensionCells(dimensionStands);
                this.availableDimensions.set(availableDims);

                const validStands = stands.filter(s => s.status !== Status.CANCELED && s.status !== Status.REFUSED);

                // map floorPlans light + compute assigned stand ids ONCE
                const assignedStandIds = new Set<string>();
                const assignedDims: DimensionCell[] = [];
                const mappedPlans: IFloorPlan[] = [];

                this.standIndex.clear();

                if (floorPlans.length > 0) {
                    floorPlans.forEach((fp, planIndex) => {
                        const full = mapFloorPlanLight(fp, availableDims, stands);
                        mappedPlans.push(full);

                        // index assigned dims + stand index
                        for (const row of full.data.cells) {
                            for (const cell of row) {
                                if (!cell.firstCell || !cell.dimension) {
                                    continue;
                                }
                                const sid = cell.dimension.stand?.id;
                                if (sid) {
                                    assignedStandIds.add(sid);
                                    assignedDims.push(cell.dimension);
                                    this.standIndex.set(sid, {planIndex, dimension: cell.dimension});
                                }
                            }
                        }
                    });
                } else {
                    // default plan
                    mappedPlans.push(this.buildDefaultPlan());
                }

                this.floorPlans.set(mappedPlans);
                this.activeIndex.set(0);

                // available stands dims = stands not already assigned
                const availableStandDims = validStands
                    .filter(s => !assignedStandIds.has(s.id!))
                    .map(s => convertAvailableDimensionCell(s.dimension, s));

                this.unassignedStandDimensions.set(availableStandDims);
                this.assignedStandDimensions.set(assignedDims);

                // nextPosition = max(position)+1
                this.nextPosition.setValue(this.computeNextPosition(mappedPlans));
            });
    }

    private resetDataState(): void {
        this.floorPlans.set([]);
        this.activeIndex.set(0);
        this.floorPlansToRemove.set([]);

        this.stands.set([]);
        this.availableDimensions.set([]);
        this.unassignedStandDimensions.set([]);
        this.assignedStandDimensions.set([]);

        this.searchDimensionCell.setValue(null, {emitEvent: false});
        this.selectStandDialog.set(null);
        this.idDisplaySensibleInformation.set(null);

        this.standIndex.clear();
        this.shapeIndex.clear();
    }

    private buildDefaultPlan(): IFloorPlan {
        return {
            id: null,
            position: 1,
            name: 'default',
            data: {
                cells: Array.from({length: 30}, () =>
                    Array.from({length: 60}, () => ({
                        id: null,
                        firstCell: false,
                        colorHighlight: this.DEFAULT_HIGHLIGHT,
                        dimension: null,
                        unusable: false
                    }) as GridCell)
                ),
                widthMeter: 30,
                heightMeter: 15,
                spacingMeter: 0.5
            } as IFloorPlanData
        };
    }

    private computeNextPosition(plans: IFloorPlan[]): number {
        let max = 0;
        for (const p of plans) {
            for (const row of p.data.cells) {
                for (const cell of row) {
                    const pos = cell.dimension?.position;
                    if (typeof pos === 'number' && pos > max) {
                        max = pos;
                    }
                }
            }
        }
        return max + 1;
    }

    // ---------------------------------------------------------------------------
    // search
    private applySearch(dimensionCell: DimensionCell | null): void {
        // clear previous "searched" flags (only on previously searched dimension if you want)
        // ici : on garde simple => on reset uniquement l’ancien stand si présent
        // (sinon, tu peux laisser sans reset, et gérer ça visuellement dans le tile)
        for (const {dimension} of this.standIndex.values()) {
            dimension.searched = false;
        }

        if (!dimensionCell?.stand?.id) {
            return;
        }

        const hit = this.standIndex.get(dimensionCell.stand.id);
        if (!hit) {
            return;
        }

        this.activeIndex.set(hit.planIndex);
        hit.dimension.searched = true;
        this.showSearchStands.set(false);
    }

    // ---------------------------------------------------------------------------
    // plan tabs
    changePlanView(index: number): void {
        if (index === this.activeIndex()) {
            return;
        }
        this.activeIndex.set(index);
    }

    canMoveFloorPlan(mode: 'right' | 'left'): boolean {
        const plans = this.floorPlans();
        const active = this.activePlan();
        if (!active) {
            return false;
        }
        if (mode === 'right') {
            return plans.length > active.position;
        }
        return active.position > 1;
    }

    movePositionFloorPlan(mode: 'right' | 'left'): void {
        const plans = this.floorPlans();
        const active = this.activePlan();
        if (!active || !this.canMoveFloorPlan(mode)) {
            return;
        }

        const delta = mode === 'right' ? 1 : -1;
        const neighborPos = active.position + delta;
        const neighbor = plans.find(fp => fp.position === neighborPos);
        if (!neighbor) {
            return;
        }

        const tmp = active.position;
        active.position = neighbor.position;
        neighbor.position = tmp;

        const sorted = [...plans].sort((a, b) => a.position - b.position);
        this.floorPlans.set(sorted);
        this.activeIndex.set(this.activeIndex() + delta);
    }

    openAddDialog(): void {
        const modalRef = this.modalService.open(AddPlanDialogComponent, {size: 'lg', backdrop: 'static'});

        modalRef.closed
                .pipe(filter(r => r.event === ITEM_ADDED_EVENT), takeUntilDestroyed(this.destroyRef))
                .subscribe(r => {
                    const info = r.data as AddPlanInfo;
                    const spacingMultiply = 1 / info.spacingMeter;

                    const newPlan: IFloorPlan = {
                        id: null,
                        position: this.floorPlans().length + 1,
                        name: info.name,
                        data: {
                            cells: Array.from({length: info.heightMeter * spacingMultiply}, () =>
                                Array.from({length: info.widthMeter * spacingMultiply}, () => ({
                                    id: null,
                                    firstCell: false,
                                    colorHighlight: this.DEFAULT_HIGHLIGHT,
                                    dimension: null,
                                    unusable: false
                                }) as GridCell)
                            ),
                            widthMeter: info.widthMeter,
                            heightMeter: info.heightMeter,
                            spacingMeter: info.spacingMeter
                        } as IFloorPlanData
                    };

                    this.floorPlans.set([...this.floorPlans(), newPlan]);
                    this.activeIndex.set(this.floorPlans().length - 1);
                });
    }

    rename(): void {
        const plan = this.activePlan();
        if (!plan) {
            return;
        }

        this.renamePlanName.setValue(plan.name);
        this.renameDialogVisible.set(true);
    }

    onRenamePlanCancel(): void {
        this.renameDialogVisible.set(false);
        this.renamePlanName.reset();
    }

    confirmRenamePlan(): void {
        const newName = this.renamePlanName.value;
        if (!newName || !newName.trim()) {
            return;
        }

        const plan = this.activePlan();
        if (!plan) {
            return;
        }

        plan.name = newName;
        this.floorPlans.set([...this.floorPlans()]);
        this.renameDialogVisible.set(false);
        this.renamePlanName.reset();
    }

    delete(): void {
        const plan = this.activePlan();
        if (!plan) {
            return;
        }

        const modalRef = this.modalService.open(DeleteDialogComponent, {size: 'lg', backdrop: 'static'});
        modalRef.componentInstance.translateKey = 'floorPlan.delete.question';
        modalRef.componentInstance.translateValues = {floorName: plan.name};

        modalRef.closed
                .pipe(filter(reason => reason === ITEM_DELETED_EVENT), takeUntilDestroyed(this.destroyRef))
                .subscribe(() => {
                    const salonId = this.salon()?.id;
                    if (!salonId) {
                        return;
                    }

                    if (plan.id) {
                        this.floorPlansToRemove.set([...this.floorPlansToRemove(), plan.id]);
                    }

                    const next = this.floorPlans().filter((_, i) => i !== this.activeIndex());
                    // renumber positions
                    next.sort((a, b) => a.position - b.position).forEach((fp, i) => (fp.position = i + 1));

                    this.floorPlans.set(next);
                    this.activeIndex.set(Math.max(0, this.activeIndex() - 1));
                });
    }

    // ---------------------------------------------------------------------------
    // save
    save(): void {
        this.resetPalette();
        const salonId = this.salon()?.id;
        if (!salonId) {
            return;
        }

        this.isLoading.set(true);

        const ops: Observable<any>[] = [
            ...this.floorPlans()
                   .map(fp => {
                       const toSave = mapFloorPlan(fp);
                       return toSave.id
                              ? this.floorPlanService.save(salonId, toSave.id, toSave)
                              : this.floorPlanService.create(salonId, toSave);
                   }),
            ...this.floorPlansToRemove().map(id => this.floorPlanService.delete(salonId, id))
        ];

        if (!ops.length) {
            this.isLoading.set(false);
            this.activateReadOnlyMode();
            return;
        }

        forkJoin(ops)
            .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.activateReadOnlyMode());
    }

    // ---------------------------------------------------------------------------
    // grid logic
    adaptCursor(cell: GridCell): 'move' | 'pointer' | 'default' {
        if (this.showDimensions() || this.showAvailableStands()) {
            return 'move';
        }
        if (!cell?.dimension?.stand) {
            return 'default';
        }
        return 'pointer';
    }

    private outOfBound(row: number, col: number, shape: { rows: number; cols: number }): boolean {
        return (
            row < 0 ||
            col < 0 ||
            row + shape.rows > this.nbHeightTiles() ||
            col + shape.cols > this.nbWidthTiles()
        );
    }

    private tryGetCell(row: number, col: number): GridCell | null {
        const cells = this.activeCells();
        if (!cells.length) {
            return null;
        }
        if (row < 0 || col < 0) {
            return null;
        }
        if (row >= cells.length) {
            return null;
        }
        if (col >= cells[0].length) {
            return null;
        }
        return cells[row][col];
    }

    private canPlaceShape(row: number, col: number, shape: { rows: number; cols: number }): boolean {
        if (this.outOfBound(row, col, shape)) {
            return false;
        }

        for (let i = 0; i < shape.rows; i++) {
            for (let j = 0; j < shape.cols; j++) {
                const cell = this.tryGetCell(row + i, col + j);
                if (!cell || cell.unusable) {
                    return false;
                }
            }
        }
        return true;
    }

    private placeShape(row: number, col: number, dimension: DimensionCell): void {
        const uuid = v4();
        const cellsForIndex: GridCell[] = [];

        for (let i = 0; i < dimension.rows; i++) {
            for (let j = 0; j < dimension.cols; j++) {
                const cell = this.tryGetCell(row + i, col + j);
                if (!cell) {
                    continue;
                }

                if (i === 0 && j === 0) {
                    cell.firstCell = true;
                    cell.dimension = dimension;
                }
                cell.unusable = true;
                cell.id = uuid;
                cellsForIndex.push(cell);
            }
        }

        this.shapeIndex.set(uuid, cellsForIndex);
    }

    drop(event: CdkDragDrop<any[]>): void {
        this.clearHighlights();

        if (!this.gridContainer) {
            return;
        }

        // important: clone pour éviter que les rotations de palette touchent les dims déjà posées
        const dimensionCell = structuredClone(event.item.data) as DimensionCell;

        const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
        const x = event.dropPoint.x - gridRect.left;
        const y = event.dropPoint.y - gridRect.top;

        const row = Math.floor(y / this.PIXELS);
        const col = Math.floor(x / this.PIXELS);

        if (!this.canPlaceShape(row, col, dimensionCell)) {
            return;
        }

        this.placeShape(row, col, dimensionCell);

        const standId = dimensionCell?.stand?.id;
        if (standId) {
            this.assignedStandDimensions.set([...this.assignedStandDimensions(), dimensionCell]);
            this.unassignedStandDimensions.set(this.unassignedStandDimensions().filter(d => d.stand!.id !== standId));
            this.standIndex.set(standId, {planIndex: this.activeIndex(), dimension: dimensionCell});
        }
    }

    startDragging(cell: GridCell): void {
        this.isDragging.set(true);
        this.draggingCell = cell;

        const shapeId = cell.id;
        if (!shapeId) {
            return;
        }

        const cells = this.shapeIndex.get(shapeId) ?? [cell];
        for (const c of cells) {
            if (!c.firstCell) {
                c.id = null;
                c.dimension = null;
            }
            c.colorHighlight = this.DEFAULT_HIGHLIGHT;
            c.unusable = false;
        }

        // après startDragging, seul le firstCell garde l'id (comme ton code actuel)
        this.shapeIndex.set(shapeId, [cell]);
    }

    finishDragging(cell: GridCell): void {
        this.isDragging.set(false);

        const shapeId = cell.id;
        if (!shapeId) {
            this.draggingCell = null;
            return;
        }

        const cells = this.shapeIndex.get(shapeId) ?? [cell];
        for (const c of cells) {
            this.resetCell(c);
        }

        this.shapeIndex.delete(shapeId);
        this.draggingCell = null;
    }

    highlightCells(event: CdkDragMove<any>): void {
        // throttle to 1/animation frame
        this.pendingHighlightEvent = event;
        if (this.highlightRaf) {
            return;
        }

        this.highlightRaf = requestAnimationFrame(() => {
            this.highlightRaf = 0;
            const ev = this.pendingHighlightEvent;
            this.pendingHighlightEvent = null;
            if (ev) {
                this.applyHighlight(ev);
            }
        });
    }

    private applyHighlight(event: CdkDragMove<any>): void {
        this.clearHighlights();

        const shape = event.source.data as { rows: number; cols: number };
        if (!this.gridContainer) {
            return;
        }

        const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
        const x = event.pointerPosition.x - gridRect.left;
        const y = event.pointerPosition.y - gridRect.top;

        const row = Math.floor(y / this.PIXELS);
        const col = Math.floor(x / this.PIXELS);

        const cellsToPaint: GridCell[] = [];
        for (let i = 0; i < shape.rows; i++) {
            for (let j = 0; j < shape.cols; j++) {
                const c = this.tryGetCell(row + i, col + j);
                if (c) {
                    cellsToPaint.push(c);
                }
            }
        }

        const ok = this.canPlaceShape(row, col, shape);
        const color = ok ? 'var(--app-surface-muted)' : 'var(--app-danger)';
        for (const c of cellsToPaint) {
            c.colorHighlight = color;
        }

        this.highlightedCells = cellsToPaint;
    }

    clearHighlights(): void {
        // only reset the previously highlighted cells (big perf win)
        for (const c of this.highlightedCells) {
            c.colorHighlight = this.DEFAULT_HIGHLIGHT;
        }
        this.highlightedCells = [];
    }

    private resetCell(cell: GridCell): void {
        cell.id = null;
        cell.firstCell = false;
        cell.dimension = null;
        cell.colorHighlight = this.DEFAULT_HIGHLIGHT;
        cell.unusable = false;
    }

    // ---------------------------------------------------------------------------
    // click / dblclick
    onClick(event: MouseEvent, cell: GridCell): void {
        event.preventDefault();
        event.stopPropagation();

        clearTimeout(this.clickTimer);
        this.clickTimer = setTimeout(() => {
            this.isReadOnly() || !this.isNumberAttribution()
            ? this.openStandDialog(cell)
            : this.onClickNumberAttribution(cell);
        }, this.clickDelay);
    }

    onDoubleClick(event: MouseEvent, cell: GridCell): void {
        clearTimeout(this.clickTimer);
        event.preventDefault();
        event.stopPropagation();

        this.idDisplaySensibleInformation.set(
            this.idDisplaySensibleInformation() ? null : (cell.id ?? null)
        );
    }

    onClickNumberAttribution(cell: GridCell): void {
        if (this.isReadOnly() || !this.isNumberAttribution() || !cell?.dimension) {
            return;
        }

        const current = Number(this.nextPosition.value ?? 0);
        if (current === 0) {
            cell.dimension.position = null;
            return;
        }

        cell.dimension.position = current;
        if (this.automaticallyIncrementNumber()) {
            this.nextPosition.setValue(current + 1);
        }
    }

    changeAttributionMode(): void {
        if (this.isReadOnly()) {
            return;
        }
        this.isNumberAttribution.set(!this.isNumberAttribution());
        if (this.isNumberAttribution()) {
            this.displayHeader.set(true);
        }
    }

    changeAutoIncrement(): void {
        if (this.isReadOnly() || !this.isNumberAttribution()) {
            return;
        }
        this.automaticallyIncrementNumber.set(!this.automaticallyIncrementNumber());
    }

    changeDisplayName(): void {
        this.displayFullname.set(!this.displayFullname());
    }

    changeTechnicalInfo(): void {
        this.displayTechnical.set(!this.displayTechnical());
    }

    changeHeader(): void {
        this.displayHeader.set(!this.displayHeader());
    }

    // ---------------------------------------------------------------------------
    // rotation
    private rotate(d: DimensionCell): void {
        const r = d.rows;
        d.rows = d.cols;
        d.cols = r;
    }

    changeRotationAvailableDimensions(): void {
        const next = this.availableDimensions().map(d => (this.rotate(d), d));
        this.availableDimensions.set(next);
    }

    changeRotationAvailableStands(): void {
        const next = this.unassignedStandDimensions().map(d => (this.rotate(d), d));
        this.unassignedStandDimensions.set(next);
    }

    // ---------------------------------------------------------------------------
    // context menu / assign / remove / prereserved
    openContextMenu(event: MouseEvent, cell: GridCell): void {
        event.preventDefault();
        if (this.isReadOnly()) {
            return;
        }

        if (!cell?.id) {
            this.cm?.hide();
            return;
        }

        this.contextMenuItems.set(this.buildContextMenuItems(cell));
        this.cm?.show(event);
    }

    openStandDialog(cell: GridCell | null): void {
        if (!cell?.dimension?.stand) {
            return;
        }
        this.selectStandDialog.set(cell);
        this.standDialogVisible.set(true);
    }

    removeShapeById(shapeId: string | null | undefined): void {
        if (!shapeId) {
            return;
        }

        const cells = this.shapeIndex.get(shapeId);
        if (!cells?.length) {
            return;
        }

        for (const cell of cells) {
            this.unassignCell(cell);
            this.resetCell(cell);
        }

        this.shapeIndex.delete(shapeId);
        this.cm?.hide();
    }

    unassign(shapeId: string | null | undefined): void {
        if (!shapeId) {
            return;
        }

        const cells = this.shapeIndex.get(shapeId);
        if (!cells?.length) {
            return;
        }

        for (const cell of cells) {
            this.unassignCell(cell);
        }

        this.cm?.hide();
    }

    assign(givenStand: IStand, givenCell: GridCell | null): void {
        if (!givenCell?.id) {
            return;
        }

        const cells = this.shapeIndex.get(givenCell.id);
        if (!cells?.length) {
            return;
        }

        for (const cell of cells) {
            if (!cell.dimension) {
                continue;
            }
            cell.dimension.stand = structuredClone(givenStand);
            cell.dimension.color = getColorStand(cell.dimension.stand);
        }

        // assign only once in assignedStandDimensions list (firstCell dimension)
        const first = cells.find(c => c.firstCell)?.dimension;
        if (first) {
            this.assignedStandDimensions.set([...this.assignedStandDimensions(), first]);
            this.standIndex.set(givenStand.id!, {planIndex: this.activeIndex(), dimension: first});
        }

        this.unassignedStandDimensions.set(this.unassignedStandDimensions().filter(d => d.stand!.id !== givenStand.id));
        this.cm?.hide();
    }

    prereserved(dimension: DimensionCell): void {
        this.prereservedTargetDimension = dimension;
        this.prereservedNote = null;
        this.prereservedDialogVisible.set(true);
        this.cm?.hide();
    }

    onPrereservedDialogHide(): void {
        this.prereservedNote = null;
        this.prereservedTargetDimension = null;
        this.prereservedDialogVisible.set(false);
    }

    canConfirmPrereserved(): boolean {
        return this.prereservedNote != null && this.prereservedNote.trim().length > 0;
    }

    confirmPrereserved(): void {
        if (!this.prereservedTargetDimension || !this.prereservedNote) {
            return;
        }
        this.prereservedTargetDimension.prereserved = {note: this.prereservedNote.trim()};
        this.onPrereservedDialogHide();
    }

    cancelPrereserved(cell: DimensionCell): void {
        if (!cell) {
            return;
        }
        cell.prereserved = null;
        this.cm?.hide();
    }

    private unassignCell(cell: GridCell): void {
        if (!cell.dimension?.stand) {
            return;
        }

        const standId = cell.dimension.stand.id!;
        this.assignedStandDimensions.set(this.assignedStandDimensions().filter(c => c.stand!.id !== standId));

        this.unassignedStandDimensions.set([
                                              ...this.unassignedStandDimensions(),
                                              convertAvailableDimensionCell(cell.dimension.stand.dimension, cell.dimension.stand)
                                          ]);

        // index search
        this.standIndex.delete(standId);

        cell.dimension.stand = null;
        cell.dimension.color = getColorStand(cell.dimension.stand);
    }

    private buildContextMenuItems(cell: GridCell): MenuItem[] {
        const items: MenuItem[] = [];
        const available = this.unassignedStandDimensions();

        if (!cell.dimension?.stand) {
            if (available.length) {
                items.push({
                               label: 'Attribuer à...',
                               icon: PrimeIcons.USER_PLUS + ' text-success',
                               items: available.map(dim => ({
                                   label: this.getFormattedParticipationName(dim.stand!.participation),
                                   icon:
                                       dim.stand!.dimension?.id === cell.dimension?.idDimension
                                       ? PrimeIcons.VERIFIED + ' text-success'
                                       : PrimeIcons.EXCLAMATION_CIRCLE + ' text-warning',
                                   command: () => this.assign(dim.stand!, cell)
                               }))
                           });
            } else {
                items.push({label: 'Aucun stand disponible', icon: PrimeIcons.USER, disabled: true});
            }
        }

        if (cell.dimension?.stand) {
            items.push({
                           label: 'Désattribuer',
                           icon: PrimeIcons.USER_MINUS + ' text-warning',
                           command: () => this.unassign(cell.id)
                       });
        }

        if (cell.dimension?.prereserved) {
            items.push({
                           label: 'Annuler la réservation',
                           icon: PrimeIcons.TAG + ' text-warning',
                           command: () => this.cancelPrereserved(cell.dimension!)
                       });
        }

        if (!cell.dimension?.stand && !cell.dimension?.prereserved) {
            items.push({
                           label: 'Réserver la place...',
                           icon: PrimeIcons.TAG + ' text-success',
                           command: () => this.prereserved(cell.dimension!)
                       });
        }

        items.push({
                       label: 'Supprimer l\'emplacement',
                       icon: PrimeIcons.TRASH + ' text-danger',
                       command: () => this.removeShapeById(cell.id)
                   });

        return items;
    }

    // ---------------------------------------------------------------------------
    // keyboard
    private handleKeydown(event: KeyboardEvent): void {
        if (this.isDragging() && event.code === 'KeyR' && this.draggingCell?.dimension) {
            event.preventDefault();
            this.rotate(this.draggingCell.dimension);
            this.clearHighlights();
        }
    }

    // ---------------------------------------------------------------------------
    // shape index
    private rebuildShapeIndex(data: IFloorPlanData): void {
        this.shapeIndex.clear();
        for (const row of data.cells) {
            for (const cell of row) {
                if (!cell.id) {
                    continue;
                }
                const list = this.shapeIndex.get(cell.id) ?? [];
                list.push(cell);
                this.shapeIndex.set(cell.id, list);
            }
        }
    }

    previousState(): void {
        window.history.back();
    }
}

export function formatterStandDimension(cell: DimensionCell): string {
    return removeAccents(getFormattedParticipationName(cell.stand?.participation));
}

export function selectFilterStandDimension(): string {
    return `stand.participation.therapistName,stand.participation.exhibitor.${selectFilterExhibitor()
        .split(',')
        .join(',exhibitor.')}`;
}
