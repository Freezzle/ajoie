import {ChangeDetectionStrategy, Component, computed, effect, input, output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {Tag} from 'primeng/tag';
import SharedModule from '../../../../../shared/shared.module';
import {ButtonBoxComponent} from '../../../../../shared/components/button-box/button-box.component';
import {SelectBoxComponent} from '../../../../../shared/components/select-box/select-box.component';
import {NumberBoxComponent} from '../../../../../shared/components/number-box/number-box.component';
import {TextBoxComponent} from '../../../../../shared/components/text-box/text-box.component';
import {CheckboxBoxComponent} from '../../../../../shared/components/checkbox-box/checkbox-box.component';

import {
    DEFAULT_ELEMENT_TYPES,
    FLOOR_ELEMENT_TYPES,
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
import {elementTypeKey, FloorConflict, FloorObject} from '../../../floor-plan.conflicts';
import {IStand} from '../../../../stand/model/stand.interface';
import {IPriceStandSalon} from '../../../../salon/model/price-stand-salon.interface';
import {getFormattedParticipationName} from '../../../../participation/model/participation.interface';
import {getExhibitorFullName} from '../../../../exhibitor/model/exhibitor.interface';
import {formatterCategory} from '../../../../enumerations/category.model';

export interface InspectorTile {
    labelKey: string;
    value: string;
    icon: string;
    highlighted: boolean;
    missing: boolean;
}

export interface StatusBar {
    status: string;
    color: string;
    count: number;
    ratio: number;
}

export interface ConflictEntry {
    objectId: string;
    label: string;
    messageKey: string;
}

/** Panneau de droite : détail de l'objet sélectionné, ou vue d'ensemble du plan. */
@Component({
               selector: 'floor-plan-inspector',
               templateUrl: './floor-plan-inspector.component.html',
               styleUrl: './floor-plan-inspector.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [
                   SharedModule,
                   ReactiveFormsModule,
                   ButtonBoxComponent,
                   SelectBoxComponent,
                   NumberBoxComponent,
                   TextBoxComponent,
                   CheckboxBoxComponent,
                   Tag
               ]
           })
export class FloorPlanInspectorComponent {
    readonly plan = input.required<IFloorPlan>();
    readonly settings = input.required<IFloorPlanSettings>();
    readonly selected = input<FloorObject | null>(null);
    readonly standsById = input.required<Map<string, IStand>>();
    readonly unassignedStands = input.required<IStand[]>();
    readonly dimensions = input.required<IPriceStandSalon[]>();
    readonly conflicts = input<FloorConflict[]>([]);
    readonly displaySensibleInformation = input(true);
    readonly readOnly = input(true);

    readonly positionChanged = output<number | null>();
    readonly dimensionChanged = output<IPriceStandSalon>();
    readonly rotationChanged = output<number>();
    readonly labelChanged = output<string>();
    readonly elementTypeChanged = output<FloorElementType>();
    readonly elementSizeChanged = output<{ widthMeter: number; depthMeter: number }>();
    readonly blockingChanged = output<boolean | null>();
    readonly standAssigned = output<IStand>();
    readonly standReleased = output<void>();
    readonly duplicateRequested = output<void>();
    readonly deleteRequested = output<void>();
    readonly conflictSelected = output<string>();

    readonly positionControl = new FormControl<number | null>(null);
    readonly angleControl = new FormControl<number | null>(0);
    readonly labelControl = new FormControl<string>('');
    readonly widthControl = new FormControl<number | null>(null);
    readonly depthControl = new FormControl<number | null>(null);
    readonly dimensionControl = new FormControl<IPriceStandSalon | null>(null);
    readonly typeControl = new FormControl<FloorElementType | null>(null);
    readonly assignControl = new FormControl<IStand | null>(null);
    readonly blockingControl = new FormControl<boolean>(true);

    readonly compassAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    readonly elementTypes = FLOOR_ELEMENT_TYPES;

    readonly location = computed(() => this.selected()?.location ?? null);
    readonly element = computed(() => this.selected()?.element ?? null);

    readonly stand = computed(() => {
        const location = this.location();
        return location?.stand ? this.standsById().get(location.stand.id) ?? null : null;
    });

    readonly standName = computed(() => {
        const stand = this.stand();
        return stand ? getFormattedParticipationName(stand.participation) : '';
    });

    readonly personName = computed(() => {
        const stand = this.stand();
        return stand ? getExhibitorFullName(stand.participation?.exhibitor) : '';
    });

    readonly categoryKey = computed(() => {
        const stand = this.stand();
        return stand ? formatterCategory(stand.category) : '';
    });

    readonly standColor = computed(() => getColorStand(this.stand()));
    readonly statusColor = computed(() => getColorStatus(this.stand()?.status));

    readonly sizeLabel = computed(() => {
        const location = this.location();
        const element = this.element();
        if (location) {
            return formatSize(location.widthMeter, location.depthMeter);
        }
        return element ? formatSize(element.widthMeter, element.depthMeter) : '';
    });

    readonly mismatch = computed(() => {
        const location = this.location();
        const stand = this.stand();
        return !!stand?.dimension?.id && !!location && stand.dimension.id !== location.idDimension;
    });

    readonly selectedConflicts = computed(() => {
        const id = this.selected()?.id;
        return id ? this.conflicts().filter(conflict => conflict.objectId === id) : [];
    });

    readonly technicalTiles = computed<InspectorTile[]>(() => {
        const stand = this.stand();
        if (!stand) {
            return [];
        }
        return [
            {
                labelKey: 'floorPlan.tech.electricity',
                value: stand.needElectricity ? 'floorPlan.tech.yes' : 'floorPlan.tech.no',
                icon: 'bolt-lightning',
                highlighted: !!stand.needElectricity,
                missing: false
            },
            {
                labelKey: 'floorPlan.tech.chairs',
                value: String(stand.nbChair ?? 0),
                icon: 'chair',
                highlighted: false,
                missing: (stand.nbChair ?? 0) === 0
            },
            {
                labelKey: 'floorPlan.tech.tables',
                value: String(stand.nbTable ?? 0),
                icon: 'cube',
                highlighted: false,
                missing: (stand.nbTable ?? 0) === 0
            },
            {
                labelKey: 'floorPlan.tech.shared',
                value: stand.shared ? 'floorPlan.tech.yes' : 'floorPlan.tech.no',
                icon: 'people-arrows',
                highlighted: !!stand.shared,
                missing: !stand.shared
            }
        ];
    });

    // ------------------------------------------------------------ vue d'ensemble

    readonly placedCount = computed(() =>
        this.plan().locations.filter(location => !!location.stand).length
    );

    readonly totalStands = computed(() => this.standsById().size);

    readonly freeCount = computed(() =>
        this.plan().locations.filter(location => !location.stand).length
    );

    readonly conflictCount = computed(() => {
        const unique = new Set(this.conflicts().map(conflict => conflict.objectId));
        return unique.size;
    });

    readonly conflictEntries = computed<ConflictEntry[]>(() => {
        const seen = new Set<string>();
        const entries: ConflictEntry[] = [];

        for (const conflict of this.conflicts()) {
            if (seen.has(conflict.objectId)) {
                continue;
            }
            seen.add(conflict.objectId);
            entries.push({
                objectId: conflict.objectId,
                label: this.labelOfObject(conflict.objectId),
                messageKey: conflict.kind === 'OUT_OF_PLAN'
                            ? 'floorPlan.stand.outOfPlan'
                            : 'floorPlan.stand.overlap'
            });
        }

        return entries;
    });

    readonly mismatchEntries = computed<ConflictEntry[]>(() =>
        this.plan().locations
            .filter(location => {
                const stand = location.stand ? this.standsById().get(location.stand.id) : undefined;
                return !!stand?.dimension?.id && stand.dimension.id !== location.idDimension;
            })
            .map(location => ({
                objectId: location.id,
                label: this.labelOfObject(location.id),
                messageKey: 'floorPlan.stand.differentDimension'
            }))
    );

    readonly categoryLegend = computed(() => {
        const used = new Map<string, string>();
        for (const location of this.plan().locations) {
            const stand = location.stand ? this.standsById().get(location.stand.id) : undefined;
            if (stand) {
                used.set(formatterCategory(stand.category), getColorStand(stand));
            }
        }
        return [...used.entries()].map(([key, color]) => ({key, color}));
    });

    readonly statusBars = computed<StatusBar[]>(() => {
        const counts = new Map<string, number>();
        for (const location of this.plan().locations) {
            const stand = location.stand ? this.standsById().get(location.stand.id) : undefined;
            if (stand?.status) {
                counts.set(stand.status, (counts.get(stand.status) ?? 0) + 1);
            }
        }

        const max = Math.max(1, ...counts.values());
        return [...counts.entries()].map(([status, count]) => ({
            status,
            color: getColorStatus(status as never),
            count,
            ratio: count / max
        }));
    });

    readonly logistics = computed(() => {
        let outlets = 0;
        let chairs = 0;
        let tables = 0;

        for (const location of this.plan().locations) {
            const stand = location.stand ? this.standsById().get(location.stand.id) : undefined;
            if (!stand) {
                continue;
            }
            outlets += stand.needElectricity ? 1 : 0;
            chairs += stand.nbChair ?? 0;
            tables += stand.nbTable ?? 0;
        }

        return {outlets, chairs, tables};
    });

    // ------------------------------------------------------------- attribution

    readonly sameDimensionStands = computed(() => {
        const location = this.location();
        return location
               ? this.unassignedStands().filter(stand => stand.dimension?.id === location.idDimension)
               : [];
    });

    readonly otherDimensionStands = computed(() => {
        const location = this.location();
        return location
               ? this.unassignedStands().filter(stand => stand.dimension?.id !== location.idDimension)
               : [];
    });

    readonly assignableStands = computed(() => [...this.sameDimensionStands(), ...this.otherDimensionStands()]);

    readonly blockingIsCustom = computed(() => this.element()?.blockingOverride != null);

    readonly blockingHelpKey = computed(() => {
        const element = this.element();
        if (!element) {
            return '';
        }
        return isElementBlocking(element, this.settings())
               ? 'floorPlan.element.blockingHelp'
               : 'floorPlan.element.nonBlockingHelp';
    });

    // ------------------------------------------------------------------ actions

    onPositionBlur(): void {
        this.positionChanged.emit(this.positionControl.value);
    }

    onAngleBlur(): void {
        this.rotationChanged.emit(this.angleControl.value ?? 0);
    }

    onLabelBlur(): void {
        this.labelChanged.emit(this.labelControl.value ?? '');
    }

    onSizeBlur(): void {
        this.elementSizeChanged.emit({
            widthMeter: this.widthControl.value ?? 0,
            depthMeter: this.depthControl.value ?? 0
        });
    }

    onDimensionBlur(): void {
        const dimension = this.dimensionControl.value;
        if (dimension) {
            this.dimensionChanged.emit(dimension);
        }
    }

    onTypeBlur(): void {
        const type = this.typeControl.value;
        if (type) {
            this.elementTypeChanged.emit(type);
        }
    }

    onAssignBlur(): void {
        const stand = this.assignControl.value;
        if (stand) {
            this.standAssigned.emit(stand);
            this.assignControl.setValue(null, {emitEvent: false});
        }
    }

    onBlockingToggle(): void {
        this.blockingChanged.emit(this.blockingControl.value ?? null);
    }

    resetBlocking(): void {
        this.blockingChanged.emit(null);
    }

    setAngle(angle: number): void {
        this.angleControl.setValue(angle, {emitEvent: false});
        this.rotationChanged.emit(angle);
    }

    angleOf(item: IFloorLocation | IFloorElement | null): number {
        return Math.round(item?.rotationDeg ?? 0);
    }

    defaultSizeOf(type: FloorElementType): string {
        const setting = this.settings().elementTypes[type] ?? DEFAULT_ELEMENT_TYPES[type];
        return formatSize(setting.widthMeter, setting.depthMeter);
    }

    private labelOfObject(objectId: string): string {
        const location = this.plan().locations.find(item => item.id === objectId);
        if (location) {
            const stand = location.stand ? this.standsById().get(location.stand.id) : undefined;
            if (stand && this.displaySensibleInformation()) {
                return getFormattedParticipationName(stand.participation);
            }
            return location.position != null ? `#${location.position}` : formatSize(location.widthMeter, location.depthMeter);
        }

        const element = this.plan().elements.find(item => item.id === objectId);
        if (!element) {
            return '';
        }
        return element.label?.trim() ?? elementTypeKey(element.type);
    }

    constructor() {
        // Les champs reflètent l'objet sélectionné ; ils ne sont jamais la source de vérité.
        effect(() => {
            const location = this.location();
            const element = this.element();

            this.positionControl.setValue(location?.position ?? null, {emitEvent: false});
            this.angleControl.setValue(Math.round((location ?? element)?.rotationDeg ?? 0), {emitEvent: false});
            this.assignControl.setValue(null, {emitEvent: false});

            this.dimensionControl.setValue(
                location ? this.dimensions().find(dimension => dimension.id === location.idDimension) ?? null : null,
                {emitEvent: false}
            );

            this.typeControl.setValue(element?.type ?? null, {emitEvent: false});
            this.labelControl.setValue(element?.label ?? '', {emitEvent: false});
            this.widthControl.setValue(element?.widthMeter ?? null, {emitEvent: false});
            this.depthControl.setValue(element?.depthMeter ?? null, {emitEvent: false});
            this.blockingControl.setValue(
                element ? isElementBlocking(element, this.settings()) : true,
                {emitEvent: false}
            );
        });
    }

    protected readonly formatSize = formatSize;
    protected readonly elementTypeKey = elementTypeKey;
    protected readonly formatterStand = (stand: IStand): string => getFormattedParticipationName(stand?.participation);
    protected readonly formatterDimension = (dimension: IPriceStandSalon): string => dimension?.dimension ?? '';
    protected readonly formatterElementType = (type: FloorElementType): string => elementTypeKey(type);
}
