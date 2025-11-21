import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CdkDrag, CdkDragEnd, CdkDragHandle, CdkDragMove, CdkDragStart} from '@angular/cdk/drag-drop';
import ColorStatusPipe from "../../../../shared/pipe/color-status.pipe";
import StatusPipe from "../../../../shared/pipe/status.pipe";
import SharedModule from "../../../../shared/shared.module";
import {DimensionCell} from "../../floor-plan.model";
import {getFirstExhibitorName} from "../../../exhibitor/model/exhibitor.interface";

@Component({
  selector: 'floor-plan-dimension-tile',
  imports: [CommonModule, SharedModule, CdkDrag, CdkDragHandle, ColorStatusPipe, StatusPipe],
  templateUrl: './floor-plan-dimension-tile.component.html',
  styleUrl: './floor-plan-dimension-tile.component.scss'
})
export class FloorPlanDimensionTileComponent {
  @Input({ required: true }) dimension!: DimensionCell;

  @Input() pixels = 20;
  @Input() variant: 'grid' | 'palette' = 'palette';

  // affichage
  @Input() displayHeader = true;
  @Input() displayTechnical = false;
  @Input() displayFullname = false;

  // comportement
  @Input() dragDisabled = false;
  @Input() dragData: any = null;
  @Input() cursor: 'move' | 'pointer' = 'pointer';
  @Input() dragging = false;

  @Output() dragStarted = new EventEmitter<CdkDragStart>();
  @Output() dragMoved = new EventEmitter<CdkDragMove>();
  @Output() dragEnded = new EventEmitter<CdkDragEnd>();
  @Output() clicked = new EventEmitter<MouseEvent>();

  protected readonly getFirstExhibitorName = getFirstExhibitorName;
}
