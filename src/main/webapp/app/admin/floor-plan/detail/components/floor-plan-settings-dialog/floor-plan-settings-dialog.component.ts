import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    Input,
    OnDestroy,
    OnInit,
    signal
} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {SelectButton} from 'primeng/selectbutton';
import {FormsModule} from '@angular/forms';

import TranslateDirective from '../../../../../shared/language/translate.directive';
import {DialogDraftService} from '../../../../../shared/services/dialog-draft.service';
import {ButtonBoxComponent} from '../../../../../shared/components/button-box/button-box.component';

import {
    cloneElementTypes,
    DEFAULT_ELEMENT_TYPES,
    emptyFloorPlan,
    FLOOR_ELEMENT_TYPES,
    FloorElementType,
    GRID_METER_OPTIONS,
    IFloorElementTypeSetting,
    IFloorPlan,
    IFloorPlanSettings,
    MOVE_STEP_METER_OPTIONS,
    ROTATION_STEP_DEG_OPTIONS
} from '../../../floor-plan.model';
import {elementTypeKey} from '../../../floor-plan.conflicts';

/** Ligne de plan dans le brouillon de la popin. */
export interface SettingsPlanRow {
    plan: IFloorPlan;
    objectCount: number;
    standCount: number;
}

/** Brouillon renvoyé par la popin quand l'organisatrice valide. */
export interface SettingsResult {
    settings: IFloorPlanSettings;
    plans: IFloorPlan[];
    idsToDelete: string[];
    displacedStands: number;
}

const MIN_PLAN_METER = 2;
const MAX_PLAN_METER = 400;
const MIN_ELEMENT_METER = 0.1;

/**
 * Contenu de la popin « Réglages du plan » : grille et pas, plans, éléments.
 * Elle travaille sur un brouillon et s'enregistre auprès de la `dialog-box` qui l'héberge :
 * rien n'est appliqué avant « Appliquer ».
 */
@Component({
               selector: 'floor-plan-settings-dialog',
               templateUrl: './floor-plan-settings-dialog.component.html',
               styleUrl: './floor-plan-settings-dialog.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [TranslatePipe, TranslateDirective, FormsModule, SelectButton, ButtonBoxComponent]
           })
export class FloorPlanSettingsDialogComponent implements OnInit, OnDestroy {
    private readonly draftService = inject(DialogDraftService);
    private readonly translateService = inject(TranslateService);

    @Input({required: true}) settings!: IFloorPlanSettings;
    @Input({required: true}) plans: IFloorPlan[] = [];

    /** Nom pré-rempli quand la popin est ouverte par le « + » des onglets. */
    @Input() newPlanName: string | null = null;

    readonly draftSettings = signal<IFloorPlanSettings>({} as IFloorPlanSettings);
    readonly draftPlans = signal<SettingsPlanRow[]>([]);
    readonly idsToDelete = signal<string[]>([]);
    readonly errors = signal<string[]>([]);

    /** Plan en attente de confirmation de suppression (il contient encore des objets). */
    pendingDeleteIndex: number | null = null;

    readonly gridOptions = GRID_METER_OPTIONS.map(value => ({label: `${value} m`, value}));
    readonly moveOptions = MOVE_STEP_METER_OPTIONS.map(value => ({label: `${value} m`, value}));
    readonly rotationOptions = ROTATION_STEP_DEG_OPTIONS.map(value => ({label: `${value}°`, value}));
    readonly elementTypes = FLOOR_ELEMENT_TYPES;

    /** Aperçu : positions possibles sur une bande de 8 m, au pas de déplacement courant. */
    readonly previewDots = computed(() => {
        const step = this.draftSettings().moveStepMeter || 0.25;
        const dots: number[] = [];
        for (let value = 0; value <= 8; value += step) {
            dots.push(Math.round(value * 1000) / 1000);
        }
        return dots;
    });

    readonly previewGridLines = computed(() => {
        const grid = this.draftSettings().gridMeter || 0.5;
        const lines: number[] = [];
        for (let value = 0; value <= 8; value += grid) {
            lines.push(Math.round(value * 1000) / 1000);
        }
        return lines;
    });

    readonly previewStandX = computed(() => {
        const step = this.draftSettings().moveStepMeter || 0.25;
        return Math.round(Math.round(1.3 / step) * step * 1000) / 1000;
    });

    ngOnInit(): void {
        this.resetDraft();
        this.draftService.registerDraft(() => this.toResult());
        this.draftService.registerValidate(() => this.validate());
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }

    private resetDraft(): void {
        this.draftSettings.set({
                                   gridMeter: this.settings.gridMeter,
                                   moveStepMeter: this.settings.moveStepMeter,
                                   rotationStepDeg: this.settings.rotationStepDeg,
                                   magnet: this.settings.magnet,
                                   elementTypes: cloneElementTypes(this.settings.elementTypes)
                               });

        const rows = this.plans.map(plan => this.toRow(structuredClone(plan)));
        if (this.newPlanName) {
            rows.push(this.toRow(emptyFloorPlan(this.newPlanName, rows.length + 1)));
        }

        this.draftPlans.set(rows);
        this.idsToDelete.set([]);
        this.errors.set([]);
        this.pendingDeleteIndex = null;
    }

    private toRow(plan: IFloorPlan): SettingsPlanRow {
        return {
            plan,
            objectCount: plan.locations.length + plan.elements.length,
            standCount: plan.locations.filter(location => !!location.stand).length
        };
    }

    // ------------------------------------------------------------ grille et pas

    setGrid(value: number): void {
        this.draftSettings.update(settings => ({...settings, gridMeter: value}));
    }

    setMoveStep(value: number): void {
        this.draftSettings.update(settings => ({...settings, moveStepMeter: value}));
    }

    setRotationStep(value: number): void {
        this.draftSettings.update(settings => ({...settings, rotationStepDeg: value}));
    }

    setMagnet(value: boolean): void {
        this.draftSettings.update(settings => ({...settings, magnet: value}));
    }

    // ------------------------------------------------------------------- plans

    movePlan(index: number, delta: number): void {
        const rows = [...this.draftPlans()];
        const target = index + delta;
        if (target < 0 || target >= rows.length) {
            return;
        }
        [rows[index], rows[target]] = [rows[target], rows[index]];
        rows.forEach((row, position) => (row.plan.position = position + 1));
        this.draftPlans.set(rows);
        this.pendingDeleteIndex = null;
    }

    addPlan(): void {
        const rows = [...this.draftPlans()];
        rows.push(this.toRow(emptyFloorPlan(this.translate('floorPlan.addNew'), rows.length + 1)));
        this.draftPlans.set(rows);
    }

    requestRemovePlan(index: number): void {
        const row = this.draftPlans()[index];
        if (row.objectCount === 0) {
            this.removePlan(index);
            return;
        }
        this.pendingDeleteIndex = index;
    }

    cancelRemovePlan(): void {
        this.pendingDeleteIndex = null;
    }

    removePlan(index: number): void {
        const rows = [...this.draftPlans()];
        const [removed] = rows.splice(index, 1);

        if (removed.plan.id) {
            this.idsToDelete.update(ids => [...ids, removed.plan.id!]);
        }
        rows.forEach((row, position) => (row.plan.position = position + 1));

        this.draftPlans.set(rows);
        this.pendingDeleteIndex = null;
    }

    onPlanNameInput(row: SettingsPlanRow, event: Event): void {
        row.plan.name = (event.target as HTMLInputElement).value;
    }

    onPlanWidthInput(row: SettingsPlanRow, event: Event): void {
        row.plan.widthMeter = Number((event.target as HTMLInputElement).value);
    }

    onPlanHeightInput(row: SettingsPlanRow, event: Event): void {
        row.plan.heightMeter = Number((event.target as HTMLInputElement).value);
    }

    // ---------------------------------------------------------------- éléments

    onElementWidthInput(type: FloorElementType, event: Event): void {
        this.updateElement(type, {widthMeter: Number((event.target as HTMLInputElement).value)});
    }

    onElementDepthInput(type: FloorElementType, event: Event): void {
        this.updateElement(type, {depthMeter: Number((event.target as HTMLInputElement).value)});
    }

    toggleElementBlocking(type: FloorElementType): void {
        this.updateElement(type, {blocking: !this.elementSetting(type).blocking});
    }

    private updateElement(type: FloorElementType, patch: Partial<IFloorElementTypeSetting>): void {
        this.draftSettings.update(settings => {
            const elementTypes = cloneElementTypes(settings.elementTypes);
            elementTypes[type] = {...elementTypes[type], ...patch};
            return {...settings, elementTypes};
        });
    }

    elementSetting(type: FloorElementType): IFloorElementTypeSetting {
        return this.draftSettings().elementTypes[type] ?? DEFAULT_ELEMENT_TYPES[type];
    }

    previewSize(type: FloorElementType): { width: number; height: number } {
        const setting = this.elementSetting(type);
        const scale = Math.min(36 / Math.max(setting.widthMeter, 0.1), 22 / Math.max(setting.depthMeter, 0.1), 12);
        return {
            width: Math.max(4, setting.widthMeter * scale),
            height: Math.max(4, setting.depthMeter * scale)
        };
    }

    // ------------------------------------------------------------- application

    /** Appelée par la `dialog-box` avant d'émettre le brouillon. */
    validate(): boolean {
        const errors: string[] = [];

        for (const row of this.draftPlans()) {
            const {widthMeter, heightMeter, name} = row.plan;
            const invalid = [widthMeter, heightMeter].some(
                value => !value || value < MIN_PLAN_METER || value > MAX_PLAN_METER
            );
            if (invalid) {
                errors.push(this.translate('floorPlan.settings.errorPlanSize', {name}));
            }
        }

        for (const type of FLOOR_ELEMENT_TYPES) {
            const setting = this.elementSetting(type);
            if (setting.widthMeter < MIN_ELEMENT_METER || setting.depthMeter < MIN_ELEMENT_METER) {
                errors.push(this.translate('floorPlan.settings.errorElementSize', {
                    type: this.translate(elementTypeKey(type))
                }));
            }
        }

        this.errors.set(errors);
        return errors.length === 0;
    }

    private toResult(): SettingsResult {
        const removedPlans = this.plans.filter(plan => plan.id && this.idsToDelete().includes(plan.id));

        return {
            settings: this.draftSettings(),
            plans: this.draftPlans().map(row => row.plan),
            idsToDelete: this.idsToDelete(),
            displacedStands: removedPlans.reduce(
                (sum, plan) => sum + plan.locations.filter(location => !!location.stand).length, 0
            )
        };
    }

    private translate(key: string, params?: Record<string, unknown>): string {
        return this.translateService.instant(key, params) as string;
    }

    protected readonly elementTypeKey = elementTypeKey;
}
