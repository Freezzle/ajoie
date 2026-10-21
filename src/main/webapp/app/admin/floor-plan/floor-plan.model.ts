import {IStand} from '../stand/model/stand.interface';
import {Category} from '../enumerations/category.model';
import {Status} from '../enumerations/status.model';
import {IPriceStandSalon, sortPriceStandSalon} from '../salon/model/price-stand-salon.interface';

/**
 * Un plan est une salle décrite en mètres. Chaque objet posé est un rectangle défini par son
 * centre, sa largeur, sa profondeur et un angle de rotation horaire autour de ce centre.
 */
export interface IFloorPlan {
    id: string | null;
    position: number;
    name: string;
    widthMeter: number;
    heightMeter: number;
    locations: IFloorLocation[];
    elements: IFloorElement[];
}

export interface IFloorLocation {
    id: string;
    idDimension: string;
    centerX: number;
    centerY: number;
    widthMeter: number;
    depthMeter: number;
    rotationDeg: number;
    position: number | null;
    stand: Pick<IStand, 'id'> | null;
    prereserved: Prereserved | null;
}

export type FloorElementType =
    | 'WALL'
    | 'PILLAR'
    | 'AISLE'
    | 'DOOR'
    | 'EXIT'
    | 'STAIRS'
    | 'ELEVATOR'
    | 'STAGE'
    | 'BAR'
    | 'WC'
    | 'TECH'
    | 'POWER'
    | 'MARK';

export interface IFloorElement {
    id: string;
    type: FloorElementType;
    label: string | null;
    centerX: number;
    centerY: number;
    widthMeter: number;
    depthMeter: number;
    rotationDeg: number;
    blockingOverride: boolean | null;
}

export interface Prereserved {
    note: string;
}

export interface IFloorElementTypeSetting {
    widthMeter: number;
    depthMeter: number;
    blocking: boolean;
}

export interface IFloorPlanSettings {
    gridMeter: number;
    moveStepMeter: number;
    rotationStepDeg: number;
    magnet: boolean;
    elementTypes: Record<FloorElementType, IFloorElementTypeSetting>;
}

export const FLOOR_ELEMENT_TYPES: FloorElementType[] = [
    'AISLE',
    'DOOR',
    'EXIT',
    'STAIRS',
    'ELEVATOR',
    'STAGE',
    'BAR',
    'WC',
    'TECH',
    'POWER',
    'MARK',
    'WALL',
    'PILLAR'
];

export const DEFAULT_ELEMENT_TYPES: Record<FloorElementType, IFloorElementTypeSetting> = {
    AISLE: {widthMeter: 10, depthMeter: 2, blocking: true},
    DOOR: {widthMeter: 5, depthMeter: 2.5, blocking: true},
    EXIT: {widthMeter: 1.5, depthMeter: 2.5, blocking: true},
    STAIRS: {widthMeter: 1.4, depthMeter: 3.2, blocking: true},
    ELEVATOR: {widthMeter: 1.8, depthMeter: 1.8, blocking: true},
    STAGE: {widthMeter: 6, depthMeter: 4, blocking: true},
    BAR: {widthMeter: 5, depthMeter: 4, blocking: true},
    WC: {widthMeter: 2.5, depthMeter: 1.6, blocking: true},
    TECH: {widthMeter: 2, depthMeter: 2, blocking: true},
    POWER: {widthMeter: 0.4, depthMeter: 0.4, blocking: false},
    MARK: {widthMeter: 3, depthMeter: 2, blocking: false},
    WALL: {widthMeter: 4, depthMeter: 0.2, blocking: true},
    PILLAR: {widthMeter: 0.5, depthMeter: 0.5, blocking: true}
};

export const GRID_METER_OPTIONS = [0.25, 0.5, 1];
export const MOVE_STEP_METER_OPTIONS = [0.05, 0.1, 0.25, 0.5, 1];
export const ROTATION_STEP_DEG_OPTIONS = [1, 5, 15, 45];

export function defaultFloorPlanSettings(): IFloorPlanSettings {
    return {
        gridMeter: 0.5,
        moveStepMeter: 0.25,
        rotationStepDeg: 15,
        magnet: true,
        elementTypes: cloneElementTypes(DEFAULT_ELEMENT_TYPES)
    };
}

export function cloneElementTypes(
    elementTypes: Record<FloorElementType, IFloorElementTypeSetting>
): Record<FloorElementType, IFloorElementTypeSetting> {
    const clone = {} as Record<FloorElementType, IFloorElementTypeSetting>;
    for (const type of FLOOR_ELEMENT_TYPES) {
        const setting = elementTypes[type] ?? DEFAULT_ELEMENT_TYPES[type];
        clone[type] = {...setting};
    }
    return clone;
}

/**
 * Complète des réglages partiels (venant du serveur) avec les valeurs par défaut, afin qu'un
 * type d'élément ajouté plus tard reste utilisable sans migration.
 */
export function normalizeFloorPlanSettings(settings: Partial<IFloorPlanSettings> | null): IFloorPlanSettings {
    const defaults = defaultFloorPlanSettings();
    if (!settings) {
        return defaults;
    }
    return {
        gridMeter: settings.gridMeter ?? defaults.gridMeter,
        moveStepMeter: settings.moveStepMeter ?? defaults.moveStepMeter,
        rotationStepDeg: settings.rotationStepDeg ?? defaults.rotationStepDeg,
        magnet: settings.magnet ?? defaults.magnet,
        elementTypes: cloneElementTypes({
            ...DEFAULT_ELEMENT_TYPES,
            ...settings.elementTypes
        })
    };
}

export function isElementBlocking(element: IFloorElement, settings: IFloorPlanSettings): boolean {
    return element.blockingOverride ?? settings.elementTypes[element.type].blocking;
}

export function getColorStand(stand: Pick<IStand, 'category'> | null | undefined): string {
    switch (stand?.category) {
        case Category.THERAPIST:
            return 'var(--app-category-therapist)';
        case Category.ARTISANAT:
            return 'var(--app-category-artisanat)';
        case Category.ENERGETIC:
            return 'var(--app-category-energetic)';
        case Category.MEDIUMNITY:
            return 'var(--app-category-mediumnity)';
        case Category.MISCELLANEOUS:
            return 'var(--app-category-miscellaneous)';
        default:
            return 'var(--app-category-none)';
    }
}

export function getColorStatus(status: Status | null | undefined): string {
    switch (status) {
        case Status.ACCEPTED:
            return 'var(--app-status-accepted)';
        case Status.VALIDATED:
            return 'var(--app-status-validated)';
        case Status.CLOSED:
            return 'var(--app-status-closed)';
        case Status.IN_VERIFICATION:
            return 'var(--app-status-verification)';
        case Status.REFUSED:
            return 'var(--app-status-refused)';
        case Status.CANCELED:
            return 'var(--app-status-canceled)';
        default:
            return 'var(--app-muted)';
    }
}

/** Dimensions vendues du salon, triées, telles qu'utilisées par la palette « Vides ». */
export function sortedDimensions(dimensionStands: IPriceStandSalon[]): IPriceStandSalon[] {
    return sortPriceStandSalon([...dimensionStands]);
}

/** `widthMeter` est la largeur horizontale du plan, `heightMeter` la profondeur. */
export function dimensionSizeOf(dimension: IPriceStandSalon): { widthMeter: number; depthMeter: number } {
    return {
        widthMeter: dimension.widthMeter ?? 1,
        depthMeter: dimension.heightMeter ?? 1
    };
}

export function formatMeter(value: number): string {
    return Number(value.toFixed(2)).toLocaleString('fr-CH');
}

export function formatSize(widthMeter: number, depthMeter: number): string {
    return `${formatMeter(widthMeter)} × ${formatMeter(depthMeter)}`;
}

export function emptyFloorPlan(name: string, position: number): IFloorPlan {
    return {
        id: null,
        position,
        name,
        widthMeter: 20,
        heightMeter: 10,
        locations: [],
        elements: []
    };
}
