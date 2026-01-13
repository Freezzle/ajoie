import {IStand} from '../stand/model/stand.interface';
import {Category} from '../enumerations/category.model';
import {IPriceStandSalon, sortPriceStandSalon} from '../salon/model/price-stand-salon.interface';

export interface IFloorPlan {
    id: string | null;
    position: number;
    name: string;
    data: IFloorPlanData;
}

export interface IFloorPlanData {
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
    prereserved: Prereserved | null;
    position: number | null;
    searched: boolean;
}

export interface Prereserved {
    note: string;
}

export interface IFloorPlanLight {
    id: string | null;
    position: number;
    name: string;
    data: IFloorPlanDataLight;
}

export interface IFloorPlanDataLight {
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
    prereserved: Prereserved | null;
    position: number | null;
}

export function mapDimensionCell(dimension?: DimensionCell | null): DimensionCellLight | null {
    if (!dimension) {
        return null;
    }
    return {
        idDimension: dimension.idDimension,
        cols: dimension.cols,
        rows: dimension.rows,
        stand: dimension.stand ? {id: dimension.stand.id} : null,
        prereserved: dimension.prereserved,
        position: dimension.position
    };
}

export function mapGridCell(cell: GridCell): GridCellLight {
    return {
        id: cell.id,
        firstCell: cell.firstCell,
        dimension: mapDimensionCell(cell.dimension),
        unusable: cell.unusable
    };
}

export function mapFloorPlan(floorPlan: IFloorPlan): IFloorPlanLight {
    return {
        id: floorPlan.id,
        position: floorPlan.position,
        name: floorPlan.name,
        data: mapFloorPlanData(floorPlan.data)
    };
}

export function mapFloorPlanData(floorPlanData: IFloorPlanData): IFloorPlanDataLight {
    return {
        cells: floorPlanData.cells.map((row) => row.map((cell) => mapGridCell(cell))),
        widthMeter: floorPlanData.widthMeter,
        heightMeter: floorPlanData.heightMeter,
        spacingMeter: floorPlanData.spacingMeter
    };
}

export function mapDimensionCellLight(
    dimensionsStands: DimensionCell[],
    stands: IStand[],
    dimension?: DimensionCellLight | null
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
        prereserved: dimension.prereserved,
        position: dimension.position,
        searched: false
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
        return '#ffe8b5';
    } else {
        return '#DDDDDD';
    }
}

export function mapGridCellLight(
    gridCellLight: GridCellLight,
    dimensionCells: DimensionCell[],
    stands: IStand[]
): GridCell {
    return {
        id: gridCellLight.id,
        firstCell: gridCellLight.firstCell,
        colorHighlight: 'white',
        dimension: gridCellLight.firstCell ? mapDimensionCellLight(dimensionCells, stands, gridCellLight.dimension) : null,
        unusable: !!gridCellLight.id
    };
}

export function convertAvailableDimensionCells(dimensionStands: IPriceStandSalon[]): DimensionCell[] {
    const dimensions = [] as DimensionCell[];

    sortPriceStandSalon(dimensionStands).forEach((dimension) => {
        dimensions.push(convertAvailableDimensionCell(dimension));
    });

    return dimensions;
}

export function convertAvailableDimensionCell(dimensionStand: IPriceStandSalon, stand?: IStand): DimensionCell {
    return {
        idDimension: dimensionStand.id,
        dimension: dimensionStand.dimension,
        stand: stand ?? null,
        color: getColorStand(stand ?? null),
        cols: (dimensionStand.heightMeter ?? 1) * 2,
        rows: (dimensionStand.widthMeter ?? 1) * 2,
        prereserved: null,
        position: null,
        searched: false
    };
}

export function mapFloorPlanDataLight(
    floorPlanDataLight: IFloorPlanDataLight,
    dimensionCells: DimensionCell[],
    stands: IStand[]
): IFloorPlanData {
    return {
        cells: floorPlanDataLight.cells.map((row) =>
                                                row.map((cell) => mapGridCellLight(cell, dimensionCells, stands))
        ),
        widthMeter: floorPlanDataLight.widthMeter,
        heightMeter: floorPlanDataLight.heightMeter,
        spacingMeter: floorPlanDataLight.spacingMeter
    };
}

export function mapFloorPlanLight(floorPlan: IFloorPlanLight, dimensionCells: DimensionCell[],
                                  stands: IStand[]): IFloorPlan {

    return {
        id: floorPlan.id,
        position: floorPlan.position,
        name: floorPlan.name,
        data: mapFloorPlanDataLight(floorPlan.data, dimensionCells, stands)
    };
}

export interface AddPlanInfo {
    name: string;
    widthMeter: number;
    heightMeter: number;
    spacingMeter: number;
}
