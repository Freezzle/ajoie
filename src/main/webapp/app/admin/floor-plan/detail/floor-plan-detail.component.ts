import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CdkDragDrop, CdkDropList} from '@angular/cdk/drag-drop';
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
    mapFloorPlanLight,
} from '../floor-plan.model';
import {IStand} from '../../stand/model/stand.interface';
import {v4} from 'uuid';
import {StandService} from '../../stand/service/stand.service';
import SharedModule from '../../../shared/shared.module';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FloorPlanService} from '../service/floor-plan.service';
import {combineLatest, filter, forkJoin, Observable} from 'rxjs';
import {ISalon} from '../../salon/model/salon.interface';
import {SalonService} from '../../salon/service/salon.service';
import {finalize, map} from 'rxjs/operators';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ITEM_ADDED_EVENT, ITEM_DELETED_EVENT, ITEM_UPDATED_EVENT} from '../../../config/navigation.constants';
import {RenamePlanDialogComponent} from '../rename-plan/rename-plan-dialog.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddPlanDialogComponent} from '../add-plan/add-plan-dialog.component';
import {DeleteDialogComponent} from '../../../shared/delete-dialog/delete-dialog.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {CommonModule} from '@angular/common';
import {Status} from '../../enumerations/status.model';
import {getFormattedParticipationName} from '../../participation/model/participation.interface';
import {AlertComponent} from "../../../shared/alert/alert.component";
import {AlertErrorComponent} from "../../../shared/alert/alert-error.component";
import {ConfirmPopup} from "primeng/confirmpopup";
import {Toast} from "primeng/toast";
import {ContextMenu} from "primeng/contextmenu";
import {MenuItem, PrimeIcons, PrimeTemplate} from "primeng/api";
import {Dialog} from "primeng/dialog";
import {Tag} from "primeng/tag";
import {Category, formatterCategory} from "../../enumerations/category.model";
import {FloorPlanDimensionTileComponent} from "./floor-plan-dimension-tile/floor-plan-dimension-tile.component";
import {CardComponent} from "../../../shared/components/card/card.component";
import {ContentPageComponent} from "../../../shared/components/content-page/content-page.component";
import ColorStatusPipe from "../../../shared/pipe/color-status.pipe";
import StatusPipe from "../../../shared/pipe/status.pipe";

@Component({
    selector: 'floor-plan',
    templateUrl: './floor-plan-detail.component.html',
    styleUrl: './floor-plan-detail.component.scss',
    imports: [SharedModule, CommonModule, RouterModule, CdkDropList, FormsModule,
        ReactiveFormsModule, ButtonBoxComponent, AlertComponent, AlertErrorComponent, ConfirmPopup, Toast, ContextMenu, Dialog, Tag, PrimeTemplate, FloorPlanDimensionTileComponent, CardComponent, ContentPageComponent, ColorStatusPipe, StatusPipe]
})
export class FloorPlanDetailComponent implements OnInit, OnDestroy {
    @ViewChild('cm', {static: true}) cm!: ContextMenu;

    protected modalService = inject(NgbModal);
    private salonService = inject(SalonService);
    private standService = inject(StandService);
    private floorPlanService = inject(FloorPlanService);
    private activatedRoute = inject(ActivatedRoute);

    PIXELS = 20;
    DEFAULT_HIGHLIGHT = '#FFFFFF';

    contextMenuItems: MenuItem[] = [];
    currentCell: GridCell | null = null;
    standDialogVisible = false;

    @ViewChild('gridDropList')
    gridContainer!: ElementRef;

    floorPlans: IFloorPlan[] = [];

    indexActiveFloorPlan = 0;

    nbWidthTiles = 60;
    nbHeightTiles = 30;
    sizeRealCell = 2;
    isLoading = false;

    stands: IStand[] = [];
    availableStandDimensions: DimensionCell[] = [];
    availableDimensions: DimensionCell[] = [];
    salon?: ISalon;
    gridCellPopOver: GridCell | null = null;
    floorPlansToRemove: string[] = [];

    isNumberAttribution: FormControl<boolean | null> = new FormControl<boolean>(false);
    automaticallyIncrementNumber: FormControl<boolean | null> = new FormControl<boolean>(true);

    nextPosition: FormControl<number | null> = new FormControl<number>(1);
    isReadOnly = true;

    displayFullname = false;
    displayTechnical = false;
    showDimensions = false;
    showAvailableStands = false;
    displayHeader = true;

    isDragging = false;
    draggingCell: GridCell | null = null;

    resetPalette(): void {
        this.showDimensions = false;
        this.showAvailableStands = false;
        this.isNumberAttribution.setValue(false);
        this.automaticallyIncrementNumber.setValue(true);
    }

    ngOnDestroy(): void {
        window.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown = (event: KeyboardEvent): void => {
        if (this.isDragging && event.code === 'KeyR' && this.draggingCell?.dimension) {
            event.preventDefault();
            this.changeRotation(this.draggingCell.dimension);
            this.clearHighlights();
        }
    };

    ngOnInit(): void {
        window.addEventListener('keydown', this.handleKeydown);
        this.initializeState();

        combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
            this.salon = data['salon'];

            if (this.salon?.id) {
                this.isLoading = true;
                combineLatest([
                    this.standService.query({idSalon: this.salon.id}).pipe(map(response => response ?? [])),
                    this.floorPlanService.load(this.salon.id),
                    this.salonService.getDimensionStands(this.salon?.id ?? null),
                ]).pipe(finalize(() => this.isLoading = false))
                    .subscribe(([stands, floorPlans, dimensionStands]) => {
                        this.availableDimensions = convertAvailableDimensionCells(dimensionStands);
                        this.stands = stands;
                        let availableStands = stands.filter(
                            stand => stand.status !== Status.CANCELED && stand.status !== Status.REFUSED);

                        if (floorPlans.length > 0) {
                            floorPlans.forEach(floorPlan => {
                                this.floorPlans.push(mapFloorPlanLight(floorPlan, this.availableDimensions, this.stands));

                                availableStands = availableStands.filter(
                                    stand => !floorPlan.data.cells.flatMap(row => row.flatMap(column => column.dimension?.stand?.id))
                                        .includes(stand.id));

                                this.availableStandDimensions = availableStands.map(stand => convertAvailableDimensionCell(stand.dimension, stand));
                            });
                        } else {
                            this.availableStandDimensions = availableStands.map(stand => convertAvailableDimensionCell(stand.dimension, stand));

                            this.floorPlans.push({
                                id: null,
                                position: 1,
                                name: 'default',
                                data: {
                                    cells: Array.from({length: 30}, () =>
                                        Array.from(
                                            {length: 60},
                                            () =>
                                                ({
                                                    id: null,
                                                    firstCell: false,
                                                    colorHighlight: this.DEFAULT_HIGHLIGHT,
                                                    dimension: null,
                                                    unusable: false,
                                                }) as GridCell,
                                        ),
                                    ),
                                    widthMeter: 30,
                                    heightMeter: 15,
                                    spacingMeter: 0.5,
                                } as IFloorPlanData,
                            });
                        }

                        this.indexActiveFloorPlan = 0;
                        this.sizeRealCell = 1 / this.getActiveFloorPlanData().spacingMeter;
                        this.nbWidthTiles = this.getActiveFloorPlanData().widthMeter * this.sizeRealCell;
                        this.nbHeightTiles = this.getActiveFloorPlanData().heightMeter * this.sizeRealCell;

                        let max = 0;
                        for (const plan of floorPlans) {
                            for (const row of plan.data.cells) {
                                for (const cell of row) {
                                    const position = cell.dimension?.position;
                                    if (typeof position === 'number' && position > max) {
                                        max = position;
                                    }
                                }
                            }
                        }

                        this.nextPosition.setValue(Number(max + 1));
                    });
            }
        });
    }

    private initializeState(): void {
        this.currentCell = null;
        this.stands = [];
        this.availableDimensions = [];
        this.availableStandDimensions = [];
        this.gridCellPopOver = null;
        this.floorPlans = [];
        this.indexActiveFloorPlan = 0;
        this.floorPlansToRemove = [];
        this.resetPalette();
    }

    activateReadOnlyMode(): void {
        this.isReadOnly = true;
        this.ngOnInit();
    }

    activateEditMode(): void {
        this.isReadOnly = false;
        this.resetPalette();
    }

    getActiveFloorPlan(): IFloorPlan {
        return this.floorPlans[this.indexActiveFloorPlan];
    }

    getActiveFloorPlanData(): IFloorPlanData {
        return this.getActiveFloorPlan().data;
    }

    outOfBound(col: number, row: number, shape: any) {
        return row < 0 || col + shape.rows > this.nbHeightTiles || row + shape.cols > this.nbWidthTiles || col < 0;
    }

    canPlaceShape(row: number, col: number, shape: any): boolean {
        if (this.outOfBound(row, col, shape)) {
            return false;
        }

        for (let i = 0; i < shape.rows; i++) {
            for (let j = 0; j < shape.cols; j++) {
                if (this.getCell(row + i, col + j).unusable) {
                    return false;
                }
            }
        }
        return true;
    }

    placeShape(row: number, col: number, dimension: DimensionCell) {
        const uuid = v4();

        for (let i = 0; i < dimension.rows; i++) {
            for (let j = 0; j < dimension.cols; j++) {
                const cellFound = this.getCell(row + i, col + j);
                if (i === 0 && j === 0) {
                    cellFound.firstCell = true;
                    cellFound.dimension = dimension;
                }

                cellFound.unusable = true;
                cellFound.id = uuid;
            }
        }
    }

    drop(event: CdkDragDrop<any[]>) {
        this.clearHighlights();

        const dimensionCell = structuredClone(event.item.data) as DimensionCell;

        if (!this.gridContainer) {return;}

        const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
        const x = event.dropPoint.x - gridRect.left;
        const y = event.dropPoint.y - gridRect.top;

        const row = Math.floor(y / this.PIXELS);
        const col = Math.floor(x / this.PIXELS);

        if (!this.canPlaceShape(row, col, dimensionCell)) {return;}

        this.placeShape(row, col, dimensionCell);

        const standId = dimensionCell?.stand?.id;
        if (standId) {
            this.availableStandDimensions = this.availableStandDimensions.filter(d => d.stand!.id !== standId);
        }
    }

    startDragging(data: GridCell) {
        this.isDragging = true;
        this.draggingCell = data;

        this.forEachCell(cell => {
            if (cell.id === data.id) {
                if (!cell.firstCell) {
                    cell.id = null;
                    cell.dimension = null;
                }
                cell.colorHighlight = this.DEFAULT_HIGHLIGHT;
                cell.unusable = false;
            }
        });
    }

    finishDragging(data: GridCell) {
        this.isDragging = false;

        this.forEachCell(cell => {
            if (cell.id === data.id) {
                this.resetCell(cell);
            }
        });

        this.draggingCell = null;
    }

    private resetCell(cell: GridCell) {
        cell.id = null;
        cell.firstCell = false;
        cell.dimension = null;
        cell.colorHighlight = this.DEFAULT_HIGHLIGHT;
        cell.unusable = false;
    }

    highlightCells(event: any) {
        this.clearHighlights();
        const shape = event.source.data;
        if (!this.gridContainer) {
            return;
        }

        const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
        const x = event.pointerPosition.x - gridRect.left;
        const y = event.pointerPosition.y - gridRect.top;

        const row = Math.floor(y / this.PIXELS);
        const col = Math.floor(x / this.PIXELS);

        if (this.outOfBound(row, col, shape) || !this.canPlaceShape(row, col, shape)) {
            for (let i = 0; i < shape.rows; i++) {
                for (let j = 0; j < shape.cols; j++) {
                    if (row < 0 || row + i >= this.getActiveFloorPlanData().cells.length || col < 0 || col + j >=
                        this.getActiveFloorPlanData().cells[0].length) {
                        continue;
                    }

                    this.getCell(row + i, col + j).colorHighlight = 'var(--app-danger)';
                }
            }
            return;
        }

        for (let i = 0; i < shape.rows; i++) {
            for (let j = 0; j < shape.cols; j++) {
                this.getCell(row + i, col + j).colorHighlight = 'var(--app-surface-muted)';
            }
        }
    }

    clearHighlights() {
        this.forEachCell(cell => {
            cell.colorHighlight = this.DEFAULT_HIGHLIGHT;
        });
    }

    previousState(): void {
        window.history.back();
    }

    save(): void {
        this.resetPalette();

        this.isLoading = true;

        const observables: Observable<any>[] = [
            ...this.floorPlans
                .map(floorPlan => {
                    if (!this.salon?.id) {
                        return null;
                    }

                    const floorToSave = mapFloorPlan(floorPlan);

                    if (floorToSave.id) {
                        return this.floorPlanService.save(this.salon.id, floorToSave.id, floorToSave);
                    } else {
                        return this.floorPlanService.create(this.salon.id, floorToSave);
                    }
                }).filter((obs): obs is Observable<any> => obs !== null),

            ...this.floorPlansToRemove
                .map(floorPlanToRemoveId => (this.salon?.id ? this.floorPlanService.delete(this.salon.id, floorPlanToRemoveId) :
                    null))
                .filter((obs): obs is Observable<any> => obs !== null),
        ];

        if (observables.length > 0) {
            forkJoin(observables)
                .pipe(finalize(() => (this.isLoading = false)))
                .subscribe(() => this.activateReadOnlyMode());
        } else {
            this.isLoading = false;
            this.activateReadOnlyMode();
        }

    }

    movePositionFloorPlan(mode: 'right' | 'left') {
        const floorPlan = this.getActiveFloorPlan();
        if (!floorPlan || !this.canMoveFloorPlan(mode)) {return;}

        const delta = mode === 'right' ? 1 : -1;
        const neighborPos = floorPlan.position + delta;

        // Trouver le voisin par sa position
        const neighbor = this.floorPlans.find(fp => fp.position === neighborPos);
        if (!neighbor) {return;}

        // Swap des positions
        const tmp = floorPlan.position;
        floorPlan.position = neighbor.position;
        neighbor.position = tmp;

        // Réordonner et remplacer le tableau pour déclencher le change detection
        this.indexActiveFloorPlan = this.indexActiveFloorPlan + delta;
        this.floorPlans = [...this.floorPlans].sort((a, b) => a.position - b.position);
    }

    canMoveFloorPlan(mode: 'right' | 'left'): boolean {
        const floorPlan = this.getActiveFloorPlan();
        if (this.floorPlans.length > floorPlan.position && mode === 'right') {
            return true;
        } else if (floorPlan.position > 1 && mode === 'left') {
            return true;
        }

        return false;
    }

    openAddDialog(): void {
        const modalRef = this.modalService.open(AddPlanDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });

        modalRef.closed
            .pipe(filter((result) => result.event === ITEM_ADDED_EVENT))
            .subscribe(result => {
                const info = result.data as AddPlanInfo;

                const spacingMultiply = (1 / info.spacingMeter);
                this.floorPlans.push({
                    id: null,
                    position: this.floorPlans.length + 1,
                    name: info.name,
                    data: {
                        cells: Array.from({length: info.heightMeter * spacingMultiply}, () =>
                            Array.from(
                                {length: info.widthMeter * spacingMultiply},
                                () =>
                                    ({
                                        id: null,
                                        firstCell: false,
                                        colorHighlight: this.DEFAULT_HIGHLIGHT,
                                        dimension: null,
                                        unusable: false,
                                    }) as GridCell,
                            ),
                        ),
                        widthMeter: info.widthMeter,
                        heightMeter: info.heightMeter,
                        spacingMeter: info.spacingMeter,
                    } as IFloorPlanData,
                });

                this.changePlanView(this.floorPlans.length - 1);
            });
    }

    changePlanView(index: number): void {
        if (index === this.indexActiveFloorPlan) {
            return;
        }
        this.indexActiveFloorPlan = index;
        const activeFloorPlan = this.getActiveFloorPlanData();
        this.sizeRealCell = 1 / activeFloorPlan.spacingMeter;
        this.nbWidthTiles = activeFloorPlan.widthMeter * this.sizeRealCell;
        this.nbHeightTiles = activeFloorPlan.heightMeter * this.sizeRealCell;
    }

    rename(): void {
        const modalRef = this.modalService.open(RenamePlanDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.floorName = this.getActiveFloorPlan().name;

        modalRef.closed
            .pipe(filter((result) => result.event === ITEM_UPDATED_EVENT))
            .subscribe(result => {
                this.getActiveFloorPlan().name = result.data;
            });
    }

    delete(): void {
        const modalRef = this.modalService.open(DeleteDialogComponent, {
            size: 'lg',
            backdrop: 'static',
        });
        modalRef.componentInstance.translateKey = 'floorPlan.delete.question';
        modalRef.componentInstance.translateValues = {floorName: this.getActiveFloorPlan().name};

        modalRef.closed
            .pipe(filter((reason) => reason === ITEM_DELETED_EVENT))
            .subscribe(() => {
                if (this.salon?.id) {
                    if (this.getActiveFloorPlan().id) {
                        this.floorPlansToRemove.push(this.getActiveFloorPlan().id!);
                    }
                    this.floorPlans.splice(this.indexActiveFloorPlan, 1);
                    let position = 1;
                    this.floorPlans.sort((a, b) => a.position - b.position).forEach(floor => {
                        floor.position = position;
                        position += 1;
                    });
                    this.indexActiveFloorPlan = this.indexActiveFloorPlan - 1;
                }
            });
    }

    onClickNumberAttribution(cell: GridCell): void {
        if (this.isReadOnly || !this.isNumberAttribution.value || !cell?.dimension) {
            return;
        }

        const currentPosition = Number(this.nextPosition.value ?? 0);

        if (currentPosition === 0) {
            cell.dimension.position = null;
        } else {
            cell.dimension.position = currentPosition;

            if (this.automaticallyIncrementNumber.value) {
                this.nextPosition.setValue(currentPosition + 1);
            }
        }
    }

    changeAttributionMode(): void {
        if (this.isReadOnly) {
            return;
        }
        this.isNumberAttribution.setValue(!this.isNumberAttribution.getRawValue());

        if (this.isNumberAttribution.value) {
            this.displayHeader = true;
        }
    }

    changeRotationAvailableDimensions(): void {
        this.availableDimensions = this.availableDimensions.map(dimension => {
            this.changeRotation(dimension);
            return dimension;
        });
    }

    changeRotationAvailableStands(): void {
        this.availableStandDimensions = this.availableStandDimensions.map(dimension => {
            this.changeRotation(dimension);
            return dimension;
        });
    }

    private changeRotation(dimension: DimensionCell) {
        const rows = dimension.rows;
        const cols = dimension.cols;
        dimension.cols = rows;
        dimension.rows = cols;
    }

    private forEachCell(callback: (cell: GridCell) => void): void {
        this.getActiveFloorPlanData().cells.forEach(row => row.forEach(cell => callback(cell)));
    }

    private getCell(row: number, col: number): GridCell {
        return this.getActiveFloorPlanData().cells[row][col];
    }

    changeAutoIncrement(): void {
        if (this.isReadOnly || !this.isNumberAttribution.value) {
            return;
        }

        this.automaticallyIncrementNumber.setValue(!this.automaticallyIncrementNumber.getRawValue());
    }

    changeDisplayName(): void {
        this.displayFullname = !this.displayFullname;
    }

    changeTechnicalInfo(): void {
        this.displayTechnical = !this.displayTechnical;
    }

    changeHeader(): void {
        this.displayHeader = !this.displayHeader;
    }

    removeShapeById(shapeId: string | null | undefined) {
        if (!shapeId) {
            return;
        }

        this.forEachCell(cell => {
            if (cell.id === shapeId) {
                this.unassignCell(cell);
                this.resetCell(cell);
            }
        });

        this.cm?.hide();
    }

    unassign(shapeId: string | null | undefined) {
        if (!shapeId) {
            return;
        }

        this.forEachCell(cell => {
            if (cell.id === shapeId) {
                this.unassignCell(cell);
            }
        });

        this.cm?.hide();
    }

    private unassignCell(cell: GridCell) {
        if (cell.dimension?.stand) {
            this.availableStandDimensions.push(convertAvailableDimensionCell(cell.dimension.stand.dimension, cell.dimension.stand));
            cell.dimension.stand = null;
            cell.dimension.color = getColorStand(cell.dimension.stand);
        }
    }

    assign(givenStand: IStand, givenCell: GridCell | null) {
        if (!givenCell) {
            return;
        }

        this.forEachCell(cell => {
            if (cell.dimension && cell.id === givenCell.id) {
                cell.dimension.stand = structuredClone(givenStand);
                cell.dimension.color = getColorStand(cell.dimension.stand);
            }
        });

        this.availableStandDimensions = this.availableStandDimensions.filter(
            dim => dim.stand!.id !== givenStand.id
        );
        this.cm?.hide();
    }

    openContextMenu(event: MouseEvent, cell: GridCell): void {
        event.preventDefault();
        if (this.isReadOnly) {
            return;
        }

        if (!cell?.id) {
            this.cm?.hide();
            return;
        }

        this.currentCell = cell;
        this.contextMenuItems = this.buildContextMenuItems(cell);
        this.cm?.show(event);
    }

    private buildContextMenuItems(cell: GridCell): MenuItem[] {
        const items: MenuItem[] = [];

        // CAS 1 : pas de stand -> on propose "Attribuer à..." (avec sous-menu)
        if (!cell.dimension?.stand) {
            if (this.availableStandDimensions.length) {
                items.push({
                    label: 'Attribuer à...',
                    icon: PrimeIcons.USER_PLUS + ' text-success',
                    items: this.availableStandDimensions.map(dim => ({
                        label: this.getFormattedParticipationName(dim.stand!.participation),
                        // petit indicateur si la dimension colle
                        icon:
                            dim.stand!.dimension?.id === cell.dimension?.idDimension
                                ? PrimeIcons.VERIFIED + ' text-success'
                                : PrimeIcons.EXCLAMATION_CIRCLE + ' text-warning',
                        command: () => this.assign(dim.stand!, cell),
                    })),
                });
            } else {
                items.push({
                    label: 'Aucun stand disponible',
                    icon: PrimeIcons.USER,
                    disabled: true,
                });
            }
        }

        // CAS 2 : stand présent -> "Désattribuer"
        if (cell.dimension?.stand) {
            items.push({
                label: 'Désattribuer',
                icon: PrimeIcons.USER_MINUS + ' text-warning',
                command: () => this.unassign(cell.id),
            });
        }

        // commun : supprimer le stand
        items.push({
            label: 'Supprimer l\'emplacement',
            icon: PrimeIcons.TRASH + ' text-danger',
            command: () => this.removeShapeById(cell.id),
        });

        return items;
    }

    openStandDialog(cell: GridCell | null): void {
        if (!cell) {
            return;
        }

        this.gridCellPopOver = cell;
        this.standDialogVisible = true;
    }

    protected readonly getFormattedParticipationName = getFormattedParticipationName;
    protected readonly formatterCategory = formatterCategory;
    protected readonly Category = Category;
    protected readonly getColorStand = getColorStand;
}
