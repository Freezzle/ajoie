import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {CdkDrag, CdkDragEnd, CdkDragPreview, CdkDropList, DragRef, Point} from '@angular/cdk/drag-drop';
import SharedModule from '../../../../../shared/shared.module';
import {ButtonBoxComponent} from '../../../../../shared/components/button-box/button-box.component';
import {TabsModule} from 'primeng/tabs';

import {
    DEFAULT_ELEMENT_TYPES,
    dimensionSizeOf,
    FLOOR_ELEMENT_TYPES,
    FloorElementType,
    formatSize,
    getColorStand,
    getColorStatus,
    IFloorElement,
    IFloorLocation,
    IFloorPlan,
    IFloorPlanSettings
} from '../../../floor-plan.model';
import {elementTypeKey} from '../../../floor-plan.conflicts';
import {aabb} from '../../../floor-plan.geometry';
import {FloorPlanCanvasComponent} from '../floor-plan-canvas/floor-plan-canvas.component';
import {IStand} from '../../../../stand/model/stand.interface';
import {IPriceStandSalon} from '../../../../salon/model/price-stand-salon.interface';
import {getFormattedParticipationName} from '../../../../participation/model/participation.interface';
import {getExhibitorFullName} from '../../../../exhibitor/model/exhibitor.interface';
import {formatterCategory} from '../../../../enumerations/category.model';
import {removeAccents} from '../../../../../shared/utils/string.util';

/** Un exposant qui reste à placer. */
export interface PaletteExhibitor {
    stand: IStand;
    name: string;
    person: string;
    color: string;
    statusColor: string;
    categoryKey: string;
    dimensionLabel: string;
    widthMeter: number;
    depthMeter: number;
}

/** Une dimension vendue, avec son avancement de pose. */
export interface PaletteDimension {
    dimension: IPriceStandSalon;
    widthMeter: number;
    depthMeter: number;
    placed: number;
    needed: number;
    missing: number;
    ratio: number;
}

export interface PaletteElement {
    type: FloorElementType;
    widthMeter: number;
    depthMeter: number;
    blocking: boolean;
}

export type PaletteTemplate =
    | { kind: 'EXHIBITOR'; stand: IStand }
    | { kind: 'DIMENSION'; dimension: IPriceStandSalon }
    | { kind: 'ELEMENT'; type: FloorElementType };

/** Objet déposé sur le plan : le modèle à poser et le point de dépôt, en pixels écran. */
export interface PaletteDrop {
    template: PaletteTemplate;
    clientX: number;
    clientY: number;
}

/** Mini-plan à un seul objet, rendu dans l'aperçu de glissé pour refléter l'entité posée. */
export interface PalettePreview {
    plan: IFloorPlan;
    standsById: Map<string, IStand>;
}

/** Encombrement de l'objet en cours de glissé, pour caler l'aperçu sur la grille. */
export interface PaletteFootprint {
    widthMeter: number;
    depthMeter: number;
}

/** Palette de gauche : exposants à placer, emplacements vides et éléments de salle. */
@Component({
               selector: 'floor-plan-palette',
               templateUrl: './floor-plan-palette.component.html',
               styleUrl: './floor-plan-palette.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [SharedModule, ButtonBoxComponent, TabsModule, CdkDropList, CdkDrag, CdkDragPreview, FloorPlanCanvasComponent]
           })
export class FloorPlanPaletteComponent {
    readonly plans = input.required<IFloorPlan[]>();
    readonly settings = input.required<IFloorPlanSettings>();
    readonly unassignedStands = input.required<IStand[]>();
    readonly dimensions = input.required<IPriceStandSalon[]>();
    readonly standsById = input.required<Map<string, IStand>>();
    readonly nextAngleDeg = input(0);
    readonly pixelsPerMeter = input(30);
    readonly disabled = input(false);
    /** Calage de l'aperçu sur le pas de déplacement quand il survole la grille. */
    readonly constrainPosition =
        input<(point: Point, dragRef: DragRef, dimensions: DOMRect, pickup: Point) => Point>();

    readonly dragStarted = output<PaletteFootprint>();
    readonly dropped = output<PaletteDrop>();
    readonly nextAngleChanged = output<number>();

    readonly filter = signal('');

    readonly angleOptions = [
        {deg: 0, icon: 'pi-arrow-down'},
        {deg: 90, icon: 'pi-arrow-left'},
        {deg: 180, icon: 'pi-arrow-up'},
        {deg: 270, icon: 'pi-arrow-right'},
        {deg: 315, icon: 'pi-arrow-down-right'}
    ];

    readonly exhibitors = computed<PaletteExhibitor[]>(() => {
        const needle = removeAccents(this.filter().trim().toLowerCase());

        return this.unassignedStands()
                   .map(stand => {
                       const size = stand.dimension ? dimensionSizeOf(stand.dimension) : {widthMeter: 1, depthMeter: 1};
                       return {
                           stand,
                           name: getFormattedParticipationName(stand.participation),
                           person: getExhibitorFullName(stand.participation.exhibitor),
                           color: getColorStand(stand),
                           statusColor: getColorStatus(stand.status),
                           categoryKey: formatterCategory(stand.category),
                           dimensionLabel: stand.dimension?.dimension ?? '',
                           widthMeter: size.widthMeter,
                           depthMeter: size.depthMeter
                       };
                   })
                   .filter(exhibitor => !needle
                       || removeAccents(`${exhibitor.name} ${exhibitor.person}`.toLowerCase()).includes(needle))
                   .sort((a, b) => a.categoryKey.localeCompare(b.categoryKey) || a.name.localeCompare(b.name));
    });

    readonly dimensionCards = computed<PaletteDimension[]>(() => {
        const locations = this.plans().flatMap(plan => plan.locations);
        const stands = this.standsById();

        return this.dimensions().map(dimension => {
            const size = dimensionSizeOf(dimension);
            const placed = locations.filter(location => location.idDimension === dimension.id).length;
            const needed = [...stands.values()].filter(stand => stand.dimension?.id === dimension.id).length;

            return {
                dimension,
                widthMeter: size.widthMeter,
                depthMeter: size.depthMeter,
                placed,
                needed,
                missing: Math.max(0, needed - placed),
                ratio: needed > 0 ? Math.min(1, placed / needed) : placed > 0 ? 1 : 0
            };
        });
    });

    readonly elements = computed<PaletteElement[]>(() => {
        const settings = this.settings();
        return FLOOR_ELEMENT_TYPES.map(type => {
            const setting = settings.elementTypes[type] ?? DEFAULT_ELEMENT_TYPES[type];
            return {
                type,
                widthMeter: setting.widthMeter,
                depthMeter: setting.depthMeter,
                blocking: setting.blocking
            };
        });
    });

    readonly toPlaceCount = computed(() => this.unassignedStands().length);

    onDragStarted(footprint: PaletteFootprint): void {
        this.dragStarted.emit(footprint);
    }

    /**
     * Fin du glissé : la carte reprend sa place dans la palette et le point de dépôt est transmis
     * à la page, qui décide si le plan est visé.
     */
    onDragEnded(event: CdkDragEnd, template: PaletteTemplate): void {
        this.dropped.emit({template, clientX: event.dropPoint.x, clientY: event.dropPoint.y});
    }

    onFilterInput(event: Event): void {
        this.filter.set((event.target as HTMLInputElement).value);
    }

    /** Mini-aperçu à l'échelle, borné pour rester lisible dans la carte. */
    previewSize(widthMeter: number, depthMeter: number): { width: number; height: number } {
        const scale = Math.min(54 / Math.max(widthMeter, 0.1), 34 / Math.max(depthMeter, 0.1), 14);
        return {
            width: Math.max(6, widthMeter * scale),
            height: Math.max(6, depthMeter * scale)
        };
    }

    /** Aperçu de glissé d'un exposant : l'emplacement avec son stand, tel qu'il sera posé. */
    exhibitorPreview(exhibitor: PaletteExhibitor): PalettePreview {
        const location: IFloorLocation = {
            id: 'preview',
            idDimension: exhibitor.stand.dimension?.id ?? '',
            centerX: 0,
            centerY: 0,
            widthMeter: exhibitor.widthMeter,
            depthMeter: exhibitor.depthMeter,
            rotationDeg: this.nextAngleDeg(),
            position: null,
            stand: {id: exhibitor.stand.id},
            prereserved: null
        };
        return {
            plan: this.previewPlan(exhibitor.widthMeter, exhibitor.depthMeter, [location], []),
            standsById: new Map([[exhibitor.stand.id, exhibitor.stand]])
        };
    }

    /** Aperçu de glissé d'un emplacement vide, tel qu'il sera posé. */
    dimensionPreview(card: PaletteDimension): PalettePreview {
        const location: IFloorLocation = {
            id: 'preview',
            idDimension: card.dimension.id ?? '',
            centerX: 0,
            centerY: 0,
            widthMeter: card.widthMeter,
            depthMeter: card.depthMeter,
            rotationDeg: this.nextAngleDeg(),
            position: null,
            stand: null,
            prereserved: null
        };
        return {
            plan: this.previewPlan(card.widthMeter, card.depthMeter, [location], []),
            standsById: new Map()
        };
    }

    /** Aperçu de glissé d'un élément de salle, tel qu'il sera posé. */
    elementPreview(element: PaletteElement): PalettePreview {
        const floorElement: IFloorElement = {
            id: 'preview',
            type: element.type,
            label: null,
            centerX: 0,
            centerY: 0,
            widthMeter: element.widthMeter,
            depthMeter: element.depthMeter,
            rotationDeg: this.nextAngleDeg(),
            blockingOverride: null
        };
        return {
            plan: this.previewPlan(element.widthMeter, element.depthMeter, [], [floorElement]),
            standsById: new Map()
        };
    }

    /**
     * Construit un plan temporaire dimensionné à la boîte englobante de l'objet tourné, l'objet
     * étant centré. Le canvas « nu » le rend alors exactement comme à la dépose.
     */
    private previewPlan(widthMeter: number, depthMeter: number,
                        locations: IFloorLocation[], elements: IFloorElement[]): IFloorPlan {
        const box = aabb({x: 0, y: 0, w: widthMeter, h: depthMeter, rot: this.nextAngleDeg()});
        const planWidth = box.x1 - box.x0;
        const planHeight = box.y1 - box.y0;
        const centerX = planWidth / 2;
        const centerY = planHeight / 2;

        for (const location of locations) {
            location.centerX = centerX;
            location.centerY = centerY;
        }
        for (const element of elements) {
            element.centerX = centerX;
            element.centerY = centerY;
        }

        return {
            id: null,
            position: 0,
            name: '',
            widthMeter: planWidth,
            heightMeter: planHeight,
            locations,
            elements
        };
    }

    protected readonly formatSize = formatSize;
    protected readonly elementTypeKey = elementTypeKey;
}
