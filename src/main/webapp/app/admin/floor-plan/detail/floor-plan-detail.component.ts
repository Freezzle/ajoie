import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { getExhibitorName, getFirstExhibitorName, getFormattedExhibitorName } from '../../exhibitor/exhibitor.model';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import {
  AddPlanInfo, ContextMenu, convertAvailableDimensionCells, DimensionCell, getColorStand, GridCell, IFloorPlan,
  mapFloorPlan, mapFloorPlanLight,
} from '../floor-plan.model';
import { IStand } from '../../stand/stand.model';
import { v4 } from 'uuid';
import { StandService } from '../../stand/service/stand.service';
import SharedModule from '../../../shared/shared.module';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FloorPlanService } from '../service/floor-plan.service';
import { combineLatest, filter, forkJoin, Observable } from 'rxjs';
import { ISalon } from '../../salon/salon.model';
import { SalonService } from '../../salon/service/salon.service';
import { finalize, map } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ITEM_ADDED_EVENT, ITEM_DELETED_EVENT, ITEM_UPDATED_EVENT } from '../../../config/navigation.constants';
import { RenamePlanDialogComponent } from '../rename-plan/rename-plan-dialog.component';
import { NgbModal, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { AddPlanDialogComponent } from '../add-plan/add-plan-dialog.component';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { ButtonBoxComponent } from '../../../shared/components/button-box/button-box.component';
import { LinkBoxComponent } from '../../../shared/components/link-box/link-box.component';

@Component({
  standalone: true,
  selector: 'jhi-floor-plan',
  templateUrl: './floor-plan-detail.component.html',
  styleUrl: './floor-plan-detail.component.scss',
  imports: [SharedModule, RouterModule, CdkDragHandle, CdkDrag, CdkDropList, CdkDropListGroup, FormsModule,
            ReactiveFormsModule, ButtonBoxComponent, LinkBoxComponent],
})
export class FloorPlanDetailComponent implements OnInit {
  protected modalService = inject(NgbModal);
  private salonService = inject(SalonService);
  private standService = inject(StandService);
  private floorPlanService = inject(FloorPlanService);
  private activatedRoute = inject(ActivatedRoute);

  PIXELS = 20;
  DEFAULT_HIGHLIGHT = '#FFFFFF';

  @ViewChild('gridDropList')
  gridContainer!: ElementRef;

  floorPlans: IFloorPlan[] = [];

  indexActiveFloorPlan = 0;

  nbWidthTiles = 60;
  nbHeightTiles = 30;
  sizeRealCell = 2;
  isLoading = false;

  contextMenu: ContextMenu = { printable: 'CLOSED', x: 0, y: 0, cell: {} as GridCell } as ContextMenu;
  stands: IStand[] = [];
  availableStands: IStand[] = [];
  availableDimensions: DimensionCell[] = [];
  salon?: ISalon;
  gridCellPopOver: GridCell | null = null;
  floorPlansToRemove: string[] = [];

  readonlyForm = true;

  ngOnInit(): void {
    this.contextMenu = { printable: 'CLOSED', x: 0, y: 0, cell: {} as GridCell } as ContextMenu;
    this.stands = [];
    this.availableDimensions = [];
    this.availableStands = [];
    this.gridCellPopOver = null;
    this.floorPlans = [];
    this.indexActiveFloorPlan = 0;
    this.floorPlansToRemove = [];

    combineLatest([this.activatedRoute.paramMap, this.activatedRoute.data]).subscribe(([params, data]) => {
      this.salon = data['salon'];

      if (this.salon?.id) {
        this.isLoading = true;
        combineLatest([
          this.standService.query({ idSalon: this.salon.id }).pipe(map(response => response.body ?? [])),
          this.floorPlanService.load(this.salon.id),
          this.salonService.getDimensionStands(this.salon?.id ?? null),
        ]).pipe(finalize(() => this.isLoading = false))
          .subscribe(([stands, floorPlans, dimensionStands]) => {
            this.availableDimensions = convertAvailableDimensionCells(dimensionStands);
            this.stands = stands;
            this.availableStands = stands;

            if (floorPlans.length > 0) {
              floorPlans.forEach(floorPlan => {
                this.floorPlans.push(mapFloorPlanLight(floorPlan, this.availableDimensions, this.stands));

                this.availableStands = this.availableStands.filter(
                  stand => !floorPlan.cells.flatMap(row => row.flatMap(column => column.dimension?.stand?.id))
                    .includes(stand.id));
              });
            } else {
              this.floorPlans.push({
                name: 'default',
                cells: Array.from({ length: 30 }, () =>
                  Array.from(
                    { length: 60 },
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
              } as IFloorPlan);
            }

            this.indexActiveFloorPlan = 0;
            this.sizeRealCell = 1 / this.getActiveFloorPlan().spacingMeter;
            this.nbWidthTiles = this.getActiveFloorPlan().widthMeter * this.sizeRealCell;
            this.nbHeightTiles = this.getActiveFloorPlan().heightMeter * this.sizeRealCell;
          });
      }
    });
  }

  readOnlyBack(): void {
    this.readonlyForm = true;
    this.ngOnInit();
  }

  writeBack(): void {
    this.readonlyForm = false;
  }

  getActiveFloorPlan(): IFloorPlan {
    return this.floorPlans[this.indexActiveFloorPlan];
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
        if (this.getActiveFloorPlan().cells[row + i][col + j].id) {
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
        if (i === 0 && j === 0) {
          this.getActiveFloorPlan().cells[row + i][col + j].firstCell = true;
        }
        this.getActiveFloorPlan().cells[row + i][col + j].id = uuid;
        this.getActiveFloorPlan().cells[row + i][col + j].dimension = dimension;
      }
    }
  }

  removeShapeById(shapeId: string | null) {
    if (!shapeId) {
      return;
    }

    let hasAlreadyDeassign = false;

    this.getActiveFloorPlan().cells.forEach(row =>
      row.forEach(cell => {
        if (cell.id === shapeId) {
          if (cell.dimension?.stand && !hasAlreadyDeassign) {
            this.availableStands.push(JSON.parse(JSON.stringify(cell.dimension.stand)) as IStand);
            hasAlreadyDeassign = true;
          }

          cell.id = null;
          cell.dimension = null;
          cell.colorHighlight = this.DEFAULT_HIGHLIGHT;
          cell.firstCell = false;
        }
      }),
    );
    this.contextMenu.printable = 'CLOSED';
  }

  unassign(shapeId: string | null) {
    if (!shapeId) {
      return;
    }

    let hasDone = false;

    this.getActiveFloorPlan().cells.forEach(row =>
      row.forEach(cell => {
        if (cell.id === shapeId) {
          if (cell.dimension?.stand && !hasDone) {
            this.availableStands.push(JSON.parse(JSON.stringify(cell.dimension.stand)) as IStand);
            cell.dimension.stand = null;
            cell.dimension.color = getColorStand(cell.dimension.stand);
            hasDone = true;
          } else if (cell.dimension?.stand) {
            cell.dimension.stand = null;
          }
        }
      }),
    );
    this.contextMenu.printable = 'CLOSED';
  }

  assign(givenStand: IStand, givenCell: GridCell | null) {
    if (!givenCell) {
      return;
    }

    this.getActiveFloorPlan().cells.forEach(row =>
      row.forEach(cell => {
        if (cell.dimension && cell.id === givenCell.id) {
          cell.dimension.stand = JSON.parse(JSON.stringify(givenStand)) as IStand;
          cell.dimension.color = getColorStand(cell.dimension.stand);
        }
      }),
    );

    this.availableStands = this.availableStands.filter(stand => stand.id !== givenStand.id);
    this.contextMenu.printable = 'CLOSED';
  }

  openContextMenu(event: MouseEvent, row: number, col: number) {
    event.preventDefault();
    if (this.readonlyForm) {
      return;
    }

    const cell = this.getActiveFloorPlan().cells[row][col];
    if (cell?.id) {
      const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
      // Calculer la position relative au conteneur
      const x = event.clientX + (this.gridContainer ? this.gridContainer.nativeElement.scrollLeft : 0);
      const y = event.clientY + (this.gridContainer ? this.gridContainer.nativeElement.scrollTop : 0);

      const xPos = Math.floor(x);
      const yPos = Math.floor(y);

      this.contextMenu = {
        printable: 'MAIN',
        x: xPos, // ou xPos
        y: yPos, // ou yPos
        cell: cell,
      };
    } else {
      this.contextMenu.printable = 'CLOSED';
    }
  }

  togglePopover(popover: NgbPopover, cell: GridCell) {
    if (popover.isOpen()) {
      this.gridCellPopOver = null;
      popover.close();
    } else {
      this.gridCellPopOver = cell;
      popover.open();
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    this.clearHighlights();
    const dimensionCell = JSON.parse(JSON.stringify(event.item.data)) as DimensionCell;
    if (!this.gridContainer) {
      return;
    }

    const gridRect = this.gridContainer.nativeElement.getBoundingClientRect();
    const x = event.dropPoint.x - gridRect.left;
    const y = event.dropPoint.y - gridRect.top;

    const row = Math.floor(y / this.PIXELS);
    const col = Math.floor(x / this.PIXELS);

    if (this.outOfBound(row, col, dimensionCell)) {
      return;
    }

    if (this.canPlaceShape(row, col, dimensionCell)) {
      this.placeShape(row, col, dimensionCell);
    }
  }

  cellDrop(event: CdkDragDrop<any>, rowIndex: number, colIndex: number) {
    const shape = event.item.data;

    if (!shape) {
      return;
    }

    // Check if shape fits in grid
    if (this.canPlaceShape(rowIndex, colIndex, shape)) {
      this.placeShape(rowIndex, colIndex, shape);
    }
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
          if (row < 0 || row + i >= this.getActiveFloorPlan().cells.length || col < 0 || col + j >=
              this.getActiveFloorPlan().cells[0].length) {
            continue;
          }
          this.getActiveFloorPlan().cells[row + i][col + j].colorHighlight = 'rgb(255, 0, 0, 0.5)';
        }
      }
      return;
    }

    for (let i = 0; i < shape.rows; i++) {
      for (let j = 0; j < shape.cols; j++) {
        this.getActiveFloorPlan().cells[row + i][col + j].colorHighlight = 'rgb(255,255,0,0.5)';
      }
    }
  }

  clearHighlights() {
    this.getActiveFloorPlan().cells.forEach(row => row.forEach(cell => (cell.colorHighlight = this.DEFAULT_HIGHLIGHT)));
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isLoading = true;

    const observables: Observable<any>[] = [
      ...this.floorPlans
        .map(floorPlan => {
          if (!this.salon?.id) {
            return null;
          }

          const floorToSave = mapFloorPlan(floorPlan);
          return floorToSave.id
                 ? this.floorPlanService.save(this.salon.id, floorToSave.id, JSON.stringify(floorToSave))
                 : this.floorPlanService.create(this.salon.id, JSON.stringify(floorToSave));
        })
        .filter((obs): obs is Observable<any> => obs !== null), // Type assertion pour éviter les erreurs

      ...this.floorPlansToRemove
        .map(floorPlanToRemoveId => (this.salon?.id ? this.floorPlanService.delete(this.salon.id, floorPlanToRemoveId) :
                                     null))
        .filter((obs): obs is Observable<any> => obs !== null),
    ];

    if (observables.length > 0) {
      forkJoin(observables)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(() => this.readOnlyBack());
    } else {
      this.isLoading = false;
      this.readOnlyBack();
    }

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
          name: info.name,
          cells: Array.from({ length: info.heightMeter * spacingMultiply }, () =>
            Array.from(
              { length: info.widthMeter * spacingMultiply },
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
        } as IFloorPlan);
        this.changePlanView(this.floorPlans.length - 1);
      });
  }

  changePlanView(index: number): void {
    if (index === this.indexActiveFloorPlan) {
      return;
    }
    this.indexActiveFloorPlan = index;
    const activeFloorPlan = this.getActiveFloorPlan();
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
    modalRef.componentInstance.translateValues = { floorName: this.getActiveFloorPlan().name };

    modalRef.closed
      .pipe(filter((reason) => reason === ITEM_DELETED_EVENT))
      .subscribe(() => {
        if (this.salon?.id) {
          if (this.getActiveFloorPlan().id) {
            this.floorPlansToRemove.push(this.getActiveFloorPlan().id);
          }
          this.floorPlans.splice(this.indexActiveFloorPlan, 1);
          this.indexActiveFloorPlan = this.indexActiveFloorPlan - 1;
        }
      });
  }

  protected readonly getExhibitorName = getExhibitorName;
  protected readonly getFormattedExhibitorName = getFormattedExhibitorName;
  protected readonly getFirstExhibitorName = getFirstExhibitorName;
  protected readonly getColorStand = getColorStand;
}
