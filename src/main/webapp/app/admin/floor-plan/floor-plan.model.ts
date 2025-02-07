import { IStand } from '../stand/stand.model';
import { IDimensionStand, sortDimensionStand } from '../dimension-stand/dimension-stand.model';
import { Category } from '../enumerations/category.model';

export interface IFloorPlan {
  id: string;
  name: string;
  cells: GridCell[][];
  widthMeter: number;
  heightMeter: number;
  spacingMeter: number;
}

export interface GridCell {
  id?: string | null;
  firstCell: boolean;
  colorHighlight: string;
  dimension?: DimensionCell | null;
  unusable: boolean;
}

export interface DimensionCell {
  idDimension: string;
  dimension: string;
  cols: number;
  rows: number;
  color: string;
  stand?: IStand | null;
}

export interface IFloorPlanLight {
  id: string;
  name: string;
  cells: GridCellLight[][];
  widthMeter: number;
  heightMeter: number;
  spacingMeter: number;
}

export interface GridCellLight {
  id?: string | null;
  firstCell: boolean;
  dimension?: DimensionCellLight | null;
  unusable: boolean;
}

export interface DimensionCellLight {
  idDimension: string;
  cols: number;
  rows: number;
  stand?: Pick<IStand, 'id'> | null;
}

export function mapDimensionCell(dimension?: DimensionCell | null): DimensionCellLight | null {
  if (!dimension) {
    return null;
  }
  return {
    idDimension: dimension.idDimension,
    cols: dimension.cols,
    rows: dimension.rows,
    stand: dimension.stand ? { id: dimension.stand.id } : null,
  };
}

export function mapGridCell(cell: GridCell): GridCellLight {
  return {
    id: cell.id,
    firstCell: cell.firstCell,
    dimension: mapDimensionCell(cell.dimension),
    unusable: cell.unusable,
  };
}

export function mapFloorPlan(floorPlan: IFloorPlan): IFloorPlanLight {
  return {
    id: floorPlan.id,
    name: floorPlan.name,
    cells: floorPlan.cells.map((row) => row.map((cell) => mapGridCell(cell))),
    widthMeter: floorPlan.widthMeter,
    heightMeter: floorPlan.heightMeter,
    spacingMeter: floorPlan.spacingMeter,
  };
}

export function mapDimensionCellLight(
  dimensionsStands: DimensionCell[],
  stands: IStand[],
  dimension?: DimensionCellLight | null,
): DimensionCell | null {
  if (!dimension) {
    return null;
  }

  const dimensionFound = dimensionsStands.find((dim) => dim.idDimension === dimension.idDimension);
  if (!dimensionFound) {
    return null;
  }

  const standFound = stands.find((stand) => stand.id === dimension.stand?.id);

  return {
    idDimension: dimension.idDimension,
    rows: dimension.rows,
    cols: dimension.cols,
    dimension: dimensionFound.dimension,
    color: getColorStand(standFound ?? null),
    stand: standFound,
  };
}

export function getColorStand(stand: IStand | null): string {
  if (!stand) {
    return '#FFFFFF';
  }

  if (stand?.category === Category.THERAPIST) {
    return '#C1D9E1';
  } else if (stand?.category === Category.ARTISANAT) {
    return '#C1E1C1';
  } else if (stand?.category === Category.ENERGETIC) {
    return '#FFDDC1';
  } else if (stand?.category === Category.MEDIUMNITY) {
    return '#D4C1E1';
  } else if (stand?.category === Category.MISCELLANEOUS) {
    return '#C1D9E1';
  } else {
    return '#DDDDDD';
  }
}

export function mapGridCellLight(
  gridCellLight: GridCellLight,
  dimensionCells: DimensionCell[],
  stands: IStand[],
): GridCell {
  return {
    id: gridCellLight.id,
    firstCell: gridCellLight.firstCell,
    colorHighlight: 'white',
    dimension: mapDimensionCellLight(dimensionCells, stands, gridCellLight.dimension),
    unusable: gridCellLight.unusable,
  };
}

export function convertAvailableDimensionCells(
  dimensionStands: IDimensionStand[],
): DimensionCell[] {
  const dimensions = [] as DimensionCell[];

  sortDimensionStand(dimensionStands).forEach((dimension) => {
    dimensions.push({
      idDimension: dimension.id,
      dimension: dimension.dimension,
      stand: null,
      color: getColorStand(null),
      cols: dimension.heightMeter * 2,
      rows: dimension.widthMeter * 2,
    } as DimensionCell);

    if (dimension.widthMeter !== dimension.heightMeter) {
      dimensions.push({
        idDimension: dimension.id,
        dimension: dimension.dimension,
        stand: null,
        color: getColorStand(null),
        cols: dimension.widthMeter * 2,
        rows: dimension.heightMeter * 2,
      } as DimensionCell);
    }
  });

  return dimensions;
}

export function mapFloorPlanLight(
  floorPlanLight: IFloorPlanLight,
  dimensionCells: DimensionCell[],
  stands: IStand[],
): IFloorPlan {
  return {
    id: floorPlanLight.id,
    name: floorPlanLight.name,
    cells: floorPlanLight.cells.map((row) =>
      row.map((cell) => mapGridCellLight(cell, dimensionCells, stands)),
    ),
    widthMeter: floorPlanLight.widthMeter,
    heightMeter: floorPlanLight.heightMeter,
    spacingMeter: floorPlanLight.spacingMeter,
  } as IFloorPlan;
}

export interface ContextMenu {
  printable: 'CLOSED' | 'MAIN' | 'ASSIGNATION';
  x: number;
  y: number;
  cell?: GridCell | null;
}

export interface AddPlanInfo {
  name: string;
  widthMeter: number;
  heightMeter: number;
  spacingMeter: number;
}
