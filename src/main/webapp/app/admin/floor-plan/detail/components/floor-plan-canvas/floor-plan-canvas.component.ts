import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    inject,
    input,
    output,
    viewChild
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import SharedModule from '../../../../../shared/shared.module';

import {
    FloorElementType,
    formatSize,
    getColorStand,
    getColorStatus,
    IFloorElement,
    IFloorLocation,
    IFloorPlan,
    IFloorPlanSettings,
    isElementBlocking
} from '../../../floor-plan.model';
import {
    angleOf,
    corners,
    cutText,
    fitSize,
    inside,
    Point,
    pxToMeter,
    readingFrame,
    Rect,
    wrapText
} from '../../../floor-plan.geometry';
import {elementTypeKey, FloorConflict, FloorObject, objectsOf} from '../../../floor-plan.conflicts';
import {
    GLYPH_CHAIR,
    GLYPH_ELECTRICITY,
    GLYPH_OVERLAP,
    GLYPH_PRERESERVED,
    GLYPH_SHARED,
    GLYPH_SIZE_MISMATCH,
    GLYPH_TABLE,
    statusGlyph,
    SvgGlyph
} from '../../../floor-plan.glyphs';
import {IStand} from '../../../../stand/model/stand.interface';
import {getFormattedParticipationName, getOnlyParticipationName } from '../../../../participation/model/participation.interface';
import {getExhibitorFullName} from '../../../../exhibitor/model/exhibitor.interface';

export interface CanvasBadge {
    cx: number;
    cy: number;
    r: number;
    color: string;
    glyph: SvgGlyph | null;
    glyphSize: number;
    filled: boolean;
}

export interface CanvasLine {
    y: number;
    size: number;
    text: string;
    muted: boolean;
}

export interface CanvasChip {
    x: number;
    y: number;
    w: number;
    h: number;
    glyph: SvgGlyph;
    glyphX: number;
    glyphY: number;
    glyphSize: number;
    label: string;
    labelX: number;
    labelY: number;
    labelSize: number;
    active: boolean;
}

export interface CanvasBand {
    x: number;
    y: number;
    w: number;
    h: number;
    numberText: string;
    numberSize: number;
    numberX: number;
    numberY: number;
    badges: CanvasBadge[];
}

export interface CanvasStep {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface CanvasItem {
    id: string;
    kind: 'LOCATION' | 'ELEMENT';
    transform: string;
    frameTransform: string;
    w: number;
    h: number;
    frameW: number;
    frameH: number;
    fill: string;
    opacity: number;
    dashed: boolean;
    conflict: boolean;
    mismatch: boolean;
    selected: boolean;
    searched: boolean;
    prereserved: boolean;
    empty: boolean;
    band: CanvasBand | null;
    lines: CanvasLine[];
    chips: CanvasChip[];
    steps: CanvasStep[];
    crossed: boolean;
    title: string;
    zIndex: number;
}

export interface RulerTick {
    position: number;
    major: boolean;
    label: string | null;
}

/** Rendu SVG du plan et interactions de pointage. Toutes les unités sont en mètres. */
@Component({
               selector: 'floor-plan-canvas',
               templateUrl: './floor-plan-canvas.component.html',
               styleUrl: './floor-plan-canvas.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [SharedModule]
           })
export class FloorPlanCanvasComponent {
    private readonly translateService = inject(TranslateService);

    readonly svgRef = viewChild<ElementRef<SVGSVGElement>>('svg');

    readonly plan = input.required<IFloorPlan>();
    readonly settings = input.required<IFloorPlanSettings>();
    readonly standsById = input.required<Map<string, IStand>>();
    readonly conflicts = input<Map<string, FloorConflict[]>>(new Map());
    readonly selectedId = input<string | null>(null);
    readonly searchedId = input<string | null>(null);
    readonly pixelsPerMeter = input(30);
    readonly displayTechnical = input(false);
    readonly displayFullname = input(false);
    readonly displayHeader = input(true);
    readonly displaySensibleInformation = input(true);
    readonly readOnly = input(true);

    readonly pointerDownOnObject = output<{ event: PointerEvent; object: FloorObject }>();
    readonly pointerDownOnBackground = output<PointerEvent>();
    readonly pointerDownOnRotationHandle = output<{ event: PointerEvent; object: FloorObject }>();
    readonly pointerDownOnResizeHandle = output<{ event: PointerEvent; object: FloorObject }>();
    readonly pointerMoved = output<{ event: PointerEvent; point: Point }>();
    readonly contextMenuRequested = output<{ event: MouseEvent; object: FloorObject }>();

    /** Épaisseur des règles graduées, en mètres au zoom courant. */
    readonly rulerMeter = computed(() => pxToMeter(26, this.pixelsPerMeter()));

    readonly viewBox = computed(() => {
        const plan = this.plan();
        const ruler = this.rulerMeter();
        return `${-ruler} ${-ruler} ${plan.widthMeter + ruler * 2} ${plan.heightMeter + ruler * 2}`;
    });

    readonly svgWidth = computed(() =>
        (this.plan().widthMeter + this.rulerMeter() * 2) * this.pixelsPerMeter()
    );

    readonly svgHeight = computed(() =>
        (this.plan().heightMeter + this.rulerMeter() * 2) * this.pixelsPerMeter()
    );

    readonly gridMeter = computed(() => this.settings().gridMeter);
    readonly rulerFontSize = computed(() => pxToMeter(9, this.pixelsPerMeter()));
    readonly hairline = computed(() => pxToMeter(1, this.pixelsPerMeter()));
    readonly handleRadius = computed(() => pxToMeter(6, this.pixelsPerMeter()));

    readonly ticksX = computed(() => this.buildTicks(this.plan().widthMeter));
    readonly ticksY = computed(() => this.buildTicks(this.plan().heightMeter));

    readonly scaleLabel = computed(() => {
        const plan = this.plan();
        const settings = this.settings();
        return this.translate('floorPlan.canvas.scale', {
            size: formatSize(plan.widthMeter, plan.heightMeter),
            grid: settings.gridMeter,
            step: settings.moveStepMeter
        });
    });

    private translate(key: string, params?: Record<string, unknown>): string {
        return this.translateService.instant(key, params) as string;
    }

    readonly items = computed<CanvasItem[]>(() =>
        objectsOf(this.plan())
            .map(object => this.buildItem(object))
            .sort((a, b) => a.zIndex - b.zIndex)
    );

    readonly selectedItem = computed(() => {
        const id = this.selectedId();
        return id ? this.items().find(item => item.id === id) ?? null : null;
    });

    // ------------------------------------------------------------------ rendu

    private buildTicks(lengthMeter: number): RulerTick[] {
        const ticks: RulerTick[] = [];
        for (let value = 0; value <= Math.round(lengthMeter); value++) {
            const major = value % 5 === 0;
            ticks.push({position: value, major, label: major ? String(value) : null});
        }
        return ticks;
    }

    private buildItem(object: FloorObject): CanvasItem {
        return object.location
               ? this.buildLocationItem(object, object.location)
               : this.buildElementItem(object, object.element!);
    }

    private buildLocationItem(object: FloorObject, location: IFloorLocation): CanvasItem {
        const rect = object.rect;
        const frame = readingFrame(rect);
        const stand = location.stand ? this.standsById().get(location.stand.id) : undefined;
        const conflicts = this.conflicts().get(location.id) ?? [];
        const mismatch = this.isMismatch(location, stand);
        const sensible = this.displaySensibleInformation();

        const band = this.displayHeader()
                     ? this.buildBand(frame.width, frame.height, location, stand, conflicts.length > 0, mismatch, sensible)
                     : null;

        const bandHeight = band?.h ?? 0;
        const bodyTop = -frame.height / 2 + bandHeight;
        const bodyHeight = frame.height - bandHeight;
        const technical = this.displayTechnical() && !!stand && sensible;

        return {
            id: location.id,
            kind: 'LOCATION',
            transform: this.transformOf(rect),
            frameTransform: `translate(${rect.w / 2} ${rect.h / 2}) rotate(${frame.counterRotation})`,
            w: rect.w,
            h: rect.h,
            frameW: frame.width,
            frameH: frame.height,
            fill: stand ? getColorStand(stand) : 'var(--app-surface)',
            opacity: 1,
            dashed: !stand,
            conflict: conflicts.length > 0,
            mismatch,
            selected: this.selectedId() === location.id,
            searched: this.searchedId() === location.id,
            prereserved: !!location.prereserved,
            empty: !stand,
            band,
            lines: technical ? [] : this.buildBodyLines(frame.width, bodyTop, bodyHeight, location, stand, sensible),
            chips: technical ? this.buildChips(frame.width, bodyTop, bodyHeight, stand) : [],
            steps: [],
            crossed: false,
            title: this.buildLocationTitle(location, stand, conflicts, mismatch, sensible),
            zIndex: this.selectedId() === location.id ? 100 : 50
        };
    }

    private buildElementItem(object: FloorObject, element: IFloorElement): CanvasItem {
        const rect = object.rect;
        const frame = readingFrame(rect);
        const blocking = isElementBlocking(element, this.settings());
        const label = element.label?.trim() ?? '';
        const displayLabel = label || this.translate(elementTypeKey(element.type));

        const labelSize = fitSize(
            pxToMeter(11, this.pixelsPerMeter()),
            Math.min(frame.width, frame.height) * 0.12,
            Math.min(0.4, Math.max(0.05, frame.height * 0.4))
        );

        const showLabel = this.hasLabel(element.type) && (element.type !== 'STAIRS' || label.length > 0);

        return {
            id: element.id,
            kind: 'ELEMENT',
            transform: this.transformOf(rect),
            frameTransform: `translate(${rect.w / 2} ${rect.h / 2}) rotate(${frame.counterRotation})`,
            w: rect.w,
            h: rect.h,
            frameW: frame.width,
            frameH: frame.height,
            fill: this.elementFill(element.type),
            opacity: blocking ? 1 : 0.45,
            dashed: !blocking || this.isDashedType(element.type),
            conflict: (this.conflicts().get(element.id) ?? []).length > 0,
            mismatch: false,
            selected: this.selectedId() === element.id,
            searched: false,
            prereserved: false,
            empty: false,
            band: null,
            lines: showLabel
                   ? [{
                    y: 0,
                    size: labelSize,
                    text: cutText(this.formatElementLabel(element.type, displayLabel), frame.width * 0.9, labelSize),
                    muted: false
                }]
                   : [],
            chips: [],
            steps: element.type === 'STAIRS' ? this.buildSteps(rect) : [],
            crossed: element.type === 'ELEVATOR',
            title: displayLabel,
            zIndex: this.selectedId() === element.id ? 100 : this.elementZIndex(element.type)
        };
    }

    private buildBand(
        frameWidth: number,
        frameHeight: number,
        location: IFloorLocation,
        stand: IStand | undefined,
        conflict: boolean,
        mismatch: boolean,
        sensible: boolean
    ): CanvasBand {
        const height = Math.min(
            fitSize(pxToMeter(20, this.pixelsPerMeter()), 0.24, 0.62),
            Math.max(0.05, frameHeight * 0.38)
        );

        const numberSize = height * 0.58;
        const padding = height * 0.22;
        const centerY = -frameHeight / 2 + height / 2;

        const badges: CanvasBadge[] = [];
        const radius = height * 0.34;
        let cursor = frameWidth / 2 - padding - radius;

        const push = (color: string, glyph: SvgGlyph | null, filled: boolean): void => {
            if (cursor - radius < -frameWidth / 2 + padding + numberSize * 1.6) {
                return;
            }
            badges.push({cx: cursor, cy: centerY, r: radius, color, glyph, glyphSize: radius * 1.1, filled});
            cursor -= radius * 2.3;
        };

        if (sensible && stand?.status) {
            push(getColorStatus(stand.status), statusGlyph(stand.status), true);
        }
        if (conflict) {
            push('var(--app-danger)', GLYPH_OVERLAP, false);
        }
        if (sensible && mismatch) {
            push('var(--app-warn)', GLYPH_SIZE_MISMATCH, false);
        }
        if (sensible && location.prereserved) {
            push('var(--app-accent)', GLYPH_PRERESERVED, false);
        }
        if (sensible && stand?.shared) {
            push('var(--app-muted)', GLYPH_SHARED, false);
        }

        return {
            x: -frameWidth / 2,
            y: -frameHeight / 2,
            w: frameWidth,
            h: height,
            numberText: location.position != null ? String(location.position) : '',
            numberSize,
            numberX: -frameWidth / 2 + padding,
            numberY: centerY,
            badges
        };
    }

    private buildBodyLines(
        frameWidth: number,
        bodyTop: number,
        bodyHeight: number,
        location: IFloorLocation,
        stand: IStand | undefined,
        sensible: boolean
    ): CanvasLine[] {
        const innerWidth = frameWidth * 0.9;

        /** Taille visée à l'écran, bornée par la place disponible dans l'emplacement. */
        const sizeFor = (targetPx: number, maxRatio: number): number => fitSize(
            pxToMeter(targetPx, this.pixelsPerMeter()),
            Math.min(frameWidth, bodyHeight) * 0.1,
            Math.max(0.05, Math.min(0.42, bodyHeight * maxRatio))
        );

        if (!stand) {
            const size = sizeFor(9, 0.3);
            const label = formatSize(location.widthMeter, location.depthMeter);
            const state = this.translate(
                location.prereserved ? 'floorPlan.stand.prereserved' : 'floorPlan.stand.free'
            );
            return [
                {y: bodyTop + bodyHeight * 0.38, size, text: cutText(label, innerWidth, size), muted: false},
                {
                    y: bodyTop + bodyHeight * 0.74,
                    size: size * 0.82,
                    text: cutText(state, innerWidth, size * 0.82),
                    muted: true
                }
            ];
        }

        if (!sensible) {
            return [];
        }

        // Le nom de l'exposant est volontairement plus discret que le numéro du bandeau.
        const size = sizeFor(10.5, 0.26);

        const lines: CanvasLine[] = wrapText(this.primaryName(stand), innerWidth, size, 2)
            .map((text, index) => ({
                y: bodyTop + bodyHeight * 0.4 + index * size * 1.15,
                size,
                text,
                muted: false
            }));

        return lines;
    }

    /**
     * Étiquettes arrondies du mode technique. La largeur est calculée à partir du contenu
     * (padding + picto + texte + padding) pour que le nombre reste dans l'étiquette.
     */
    private buildChips(frameWidth: number, bodyTop: number, bodyHeight: number, stand: IStand): CanvasChip[] {
        const height = Math.min(
            fitSize(pxToMeter(18, this.pixelsPerMeter()), 0.2, 0.46),
            Math.max(0.05, bodyHeight * 0.4)
        );
        const padding = height * 0.28;
        const glyphSize = height * 0.56;
        const labelSize = height * 0.52;
        const textGap = height * 0.16;
        const gap = height * 0.25;

        const definitions = [
            {glyph: GLYPH_ELECTRICITY, label: '', active: !!stand.needElectricity},
            {glyph: GLYPH_CHAIR, label: String(stand.nbChair ?? 0), active: (stand.nbChair ?? 0) > 0},
            {glyph: GLYPH_TABLE, label: String(stand.nbTable ?? 0), active: (stand.nbTable ?? 0) > 0}
        ];

        // Un chiffre occupe environ 0,6 em dans la police de l'interface.
        const textWidthOf = (label: string): number => label.length * labelSize * 0.6;

        const rows: CanvasChip[][] = [[]];
        let rowWidth = 0;

        for (const definition of definitions) {
            const contentWidth = glyphSize
                + (definition.label ? textGap + textWidthOf(definition.label) : 0);
            const width = padding * 2 + contentWidth;

            if (rowWidth + width > frameWidth * 0.92 && rows[rows.length - 1].length > 0) {
                rows.push([]);
                rowWidth = 0;
            }

            rows[rows.length - 1].push({
                x: 0,
                y: 0,
                w: width,
                h: height,
                glyph: definition.glyph,
                glyphX: 0,
                glyphY: 0,
                glyphSize,
                label: definition.label,
                labelX: 0,
                labelY: 0,
                labelSize,
                active: definition.active
            });
            rowWidth += width + gap;
        }

        const chips: CanvasChip[] = [];
        const totalHeight = rows.length * height + (rows.length - 1) * gap;
        let y = bodyTop + (bodyHeight - totalHeight) / 2;

        for (const row of rows) {
            const width = row.reduce((sum, chip) => sum + chip.w, 0) + gap * Math.max(0, row.length - 1);
            let x = -width / 2;

            for (const chip of row) {
                chips.push({
                    ...chip,
                    x,
                    y,
                    glyphX: x + padding,
                    glyphY: y + (height - glyphSize) / 2,
                    labelX: x + padding + glyphSize + textGap,
                    labelY: y + height / 2
                });
                x += chip.w + gap;
            }
            y += height + gap;
        }

        return chips;
    }

    /** Une ligne par marche, tous les 28 cm, perpendiculaire à la grande longueur. */
    private buildSteps(rect: Rect): CanvasStep[] {
        const steps: CanvasStep[] = [];
        const alongWidth = rect.w >= rect.h;
        const length = alongWidth ? rect.w : rect.h;

        for (let offset = 0.28; offset < length - 0.01; offset += 0.28) {
            steps.push(
              alongWidth
                ? { x1: offset, y1: 0, x2: offset, y2: rect.h }
                : { x1: 0, y1: offset, x2: rect.w, y2: offset },
            );
        }
        return steps;
    }

    // ------------------------------------------------------------- libellés

    private primaryName(stand: IStand): string {
        return this.displayFullname()
          ? getExhibitorFullName(stand.participation?.exhibitor)
          : getOnlyParticipationName(stand.participation);
    }

    private secondaryName(stand: IStand): string {
        return this.displayFullname()
               ? getOnlyParticipationName(stand.participation)
               : getExhibitorFullName(stand.participation?.exhibitor);
    }

    private buildLocationTitle(
        location: IFloorLocation,
        stand: IStand | undefined,
        conflicts: FloorConflict[],
        mismatch: boolean,
        sensible: boolean
    ): string {
        const lines: string[] = [];
        const number = location.position != null ? ` ${location.position}` : '';
        lines.push(`${this.translate('floorPlan.stand.title')}${number}`
                       + ` · ${formatSize(location.widthMeter, location.depthMeter)} m`);

        if (stand && sensible) {
            lines.push(this.primaryName(stand));
            const secondary = this.secondaryName(stand);
            if (secondary) {
                lines.push(secondary);
            }
            lines.push(this.translate(`stand.status.list.${stand.status}`));
        }

        if (location.prereserved && sensible) {
            lines.push(`${this.translate('floorPlan.stand.prereserved')} · ${location.prereserved.note}`);
        }

        for (const conflict of conflicts) {
            lines.push(this.translate(
                conflict.kind === 'OUT_OF_PLAN' ? 'floorPlan.stand.outOfPlan' : 'floorPlan.stand.overlap'
            ));
        }

        if (mismatch && stand) {
            lines.push(this.translate('floorPlan.stand.sizeMismatch', {
                asked: stand.dimension?.dimension ?? '',
                slot: formatSize(location.widthMeter, location.depthMeter)
            }));
        }

        return lines.join('\n');
    }

    private formatElementLabel(type: FloorElementType, label: string): string {
        return type === 'AISLE' || type === 'WC' ? label.toUpperCase() : label;
    }

    private isMismatch(location: IFloorLocation, stand: IStand | undefined): boolean {
        return !!stand?.dimension?.id && stand.dimension.id !== location.idDimension;
    }

    private hasLabel(type: FloorElementType): boolean {
        return type !== 'WALL' && type !== 'PILLAR' && type !== 'POWER';
    }

    private isDashedType(type: FloorElementType): boolean {
        return type === 'AISLE' || type === 'DOOR' || type === 'MARK';
    }

    private elementZIndex(type: FloorElementType): number {
        if (type === 'WALL' || type === 'PILLAR' || type === 'POWER') {
            return 70;
        }
        return type === 'MARK' ? 60 : 10;
    }

    private elementFill(type: FloorElementType): string {
        switch (type) {
            case 'WALL':
            case 'PILLAR':
                return 'var(--app-ink)';
            case 'DOOR':
                return 'var(--app-accent-soft)';
            case 'EXIT':
                return 'var(--app-exit-soft)';
            case 'POWER':
                return 'var(--app-amber-soft)';
            case 'MARK':
                return 'transparent';
            case 'STAGE':
            case 'BAR':
            case 'TECH':
                return 'var(--app-surface-2)';
            case 'AISLE':
                return 'var(--app-surface-muted)';
            default:
                return 'var(--app-surface)';
        }
    }

    private transformOf(rect: Rect): string {
        const angle = angleOf(rect);
        if (angle === 0) {
            return `translate(${rect.x} ${rect.y})`;
        }
        return `translate(${rect.x + rect.w / 2} ${rect.y + rect.h / 2})`
            + ` rotate(${angle}) translate(${-rect.w / 2} ${-rect.h / 2})`;
    }

    // --------------------------------------------------------- interactions

    /** Convertit un évènement de pointage en coordonnées du plan, en mètres. */
    toPlanPoint(event: PointerEvent | MouseEvent): Point {
        return this.clientToPlanPoint(event.clientX, event.clientY);
    }

    /** Convertit des coordonnées écran en coordonnées du plan, en mètres. */
    clientToPlanPoint(clientX: number, clientY: number): Point {
        const svg = this.svgRef()?.nativeElement;
        if (!svg) {
            return {x: 0, y: 0};
        }

        const bounds = svg.getBoundingClientRect();
        const ruler = this.rulerMeter();
        const ppm = this.pixelsPerMeter();

        return {
            x: (clientX - bounds.left) / ppm - ruler,
            y: (clientY - bounds.top) / ppm - ruler
        };
    }

    /** Le point est-il dans la zone dessinée du plan ? */
    containsPlanPoint(point: Point): boolean {
        const plan = this.plan();
        return point.x >= 0 && point.x <= plan.widthMeter
            && point.y >= 0 && point.y <= plan.heightMeter;
    }

    /** Objet situé sous un point : l'objet sélectionné puis les stands en priorité. */
    objectAt(point: Point): FloorObject | null {
        const candidates = objectsOf(this.plan()).filter(object => inside(point, object.rect));
        if (!candidates.length) {
            return null;
        }

        const selectedId = this.selectedId();
        return candidates.find(object => object.id === selectedId)
            ?? candidates.find(object => object.kind === 'LOCATION')
            ?? candidates[candidates.length - 1];
    }

    objectById(id: string): FloorObject | null {
        return objectsOf(this.plan()).find(object => object.id === id) ?? null;
    }

    /** Centre d'un objet, pour centrer la vue dessus. */
    centerOf(id: string): Point | null {
        const object = this.objectById(id);
        if (!object) {
            return null;
        }
        const points = corners(object.rect);
        return {
            x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
            y: points.reduce((sum, point) => sum + point.y, 0) / points.length
        };
    }

    onPointerDown(event: PointerEvent): void {
        const object = this.objectAt(this.toPlanPoint(event));
        if (object) {
            this.pointerDownOnObject.emit({event, object});
        } else {
            this.pointerDownOnBackground.emit(event);
        }
    }

    onPointerMove(event: PointerEvent): void {
        this.pointerMoved.emit({event, point: this.toPlanPoint(event)});
    }

    onContextMenu(event: MouseEvent): void {
        const object = this.objectAt(this.toPlanPoint(event));
        if (object) {
            event.preventDefault();
            this.contextMenuRequested.emit({event, object});
        }
    }

    onRotationHandleDown(event: PointerEvent): void {
        const selected = this.selectedId();
        const object = selected ? this.objectById(selected) : null;
        if (object) {
            event.stopPropagation();
            this.pointerDownOnRotationHandle.emit({event, object});
        }
    }

    onResizeHandleDown(event: PointerEvent): void {
        const selected = this.selectedId();
        const object = selected ? this.objectById(selected) : null;
        if (object) {
            event.stopPropagation();
            this.pointerDownOnResizeHandle.emit({event, object});
        }
    }
}
