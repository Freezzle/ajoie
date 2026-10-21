import {
    FloorElementType,
    IFloorElement,
    IFloorLocation,
    IFloorPlan,
    IFloorPlanSettings,
    isElementBlocking
} from './floor-plan.model';
import {angleOf, outOfPlan, overlap, Rect} from './floor-plan.geometry';
import {IStand} from '../stand/model/stand.interface';
import {IPriceStandSalon} from '../salon/model/price-stand-salon.interface';

export type FloorObjectKind = 'LOCATION' | 'ELEMENT';

/** Vue unifiée d'un objet du plan : un emplacement de stand ou un élément de salle. */
export interface FloorObject {
    id: string;
    kind: FloorObjectKind;
    rect: Rect;
    location: IFloorLocation | null;
    element: IFloorElement | null;
}

export type ConflictKind = 'OVERLAP' | 'OUT_OF_PLAN' | 'BLOCKED';

export interface FloorConflict {
    objectId: string;
    kind: ConflictKind;
    /** Autre objet impliqué, pour un chevauchement. */
    otherId: string | null;
}

export function toRect(location: IFloorLocation): Rect;
export function toRect(element: IFloorElement): Rect;
export function toRect(item: IFloorLocation | IFloorElement): Rect {
    const w = item.widthMeter;
    const h = item.depthMeter;
    return {
        x: item.centerX - w / 2,
        y: item.centerY - h / 2,
        w,
        h,
        rot: item.rotationDeg ?? 0
    };
}

/** Réapplique un rectangle (coin haut-gauche + angle) sur un objet du modèle. */
export function applyRect(item: IFloorLocation | IFloorElement, rect: Rect): void {
    item.widthMeter = round3(rect.w);
    item.depthMeter = round3(rect.h);
    item.centerX = round3(rect.x + rect.w / 2);
    item.centerY = round3(rect.y + rect.h / 2);
    item.rotationDeg = angleOf(rect);
}

export function objectsOf(plan: IFloorPlan): FloorObject[] {
    const objects: FloorObject[] = plan.locations.map(location => ({
        id: location.id,
        kind: 'LOCATION' as const,
        rect: toRect(location),
        location,
        element: null
    }));

    for (const element of plan.elements) {
        objects.push({
            id: element.id,
            kind: 'ELEMENT',
            rect: toRect(element),
            location: null,
            element
        });
    }

    return objects;
}

/**
 * Conflits du plan, selon les règles de la spécification :
 * stand × stand et stand × élément bloquant sont en conflit, un élément ne l'est jamais,
 * et un stand qui dépasse de la salle est signalé.
 */
export function computeConflicts(plan: IFloorPlan, settings: IFloorPlanSettings): FloorConflict[] {
    const conflicts: FloorConflict[] = [];
    const objects = objectsOf(plan);

    for (const object of objects) {
        if (object.kind === 'LOCATION' && outOfPlan(object.rect, plan.widthMeter, plan.heightMeter)) {
            conflicts.push({objectId: object.id, kind: 'OUT_OF_PLAN', otherId: null});
        }
    }

    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];

            // Deux éléments ne se gênent jamais.
            if (a.kind === 'ELEMENT' && b.kind === 'ELEMENT') {
                continue;
            }
            // Un élément non bloquant peut être recouvert sans conflit.
            if (a.element && !isElementBlocking(a.element, settings)) {
                continue;
            }
            if (b.element && !isElementBlocking(b.element, settings)) {
                continue;
            }
            if (!overlap(a.rect, b.rect)) {
                continue;
            }

            const kind: ConflictKind = a.kind === b.kind ? 'OVERLAP' : 'BLOCKED';
            conflicts.push({objectId: a.id, kind, otherId: b.id});
            conflicts.push({objectId: b.id, kind, otherId: a.id});
        }
    }

    return conflicts;
}

export function conflictsById(conflicts: FloorConflict[]): Map<string, FloorConflict[]> {
    const map = new Map<string, FloorConflict[]>();
    for (const conflict of conflicts) {
        const list = map.get(conflict.objectId) ?? [];
        list.push(conflict);
        map.set(conflict.objectId, list);
    }
    return map;
}

/**
 * Un exposant posé dans un emplacement d'une autre dimension est un simple avertissement,
 * pas un conflit.
 */
export function hasSizeMismatch(location: IFloorLocation, stand: IStand | undefined): boolean {
    if (!stand?.dimension?.id) {
        return false;
    }
    return stand.dimension.id !== location.idDimension;
}

export function labelOfDimension(dimensions: IPriceStandSalon[], idDimension: string): string {
    return dimensions.find(dimension => dimension.id === idDimension)?.dimension ?? '';
}

/** Libellé par défaut d'un type d'élément, via les traductions `floorPlan.element.types.*`. */
export function elementTypeKey(type: FloorElementType): string {
    return `floorPlan.element.types.${type}`;
}

function round3(value: number): number {
    return Math.round(value * 1000) / 1000;
}
