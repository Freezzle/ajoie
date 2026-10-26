import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    signal,
    viewChild
} from '@angular/core';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {combineLatest, fromEvent} from 'rxjs';
import {finalize, map} from 'rxjs/operators';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {v4 as uuid} from 'uuid';

import {MenuItem, MessageService, PrimeIcons} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';
import {ContextMenu} from 'primeng/contextmenu';
import {TabsModule} from 'primeng/tabs';
import {Textarea} from 'primeng/textarea';
import {IftaLabel} from 'primeng/iftalabel';
import {SelectButton} from 'primeng/selectbutton';
import {InputNumber} from 'primeng/inputnumber';

import SharedModule from '../../../shared/shared.module';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {DialogBoxComponent} from '../../../shared/components/dialog-box/dialog-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {AlertErrorComponent} from '../../../shared/alert/alert-error.component';

import {FloorPlanCanvasComponent} from './components/floor-plan-canvas/floor-plan-canvas.component';
import {
    FloorPlanPaletteComponent,
    PaletteDrop,
    PaletteTemplate
} from './components/floor-plan-palette/floor-plan-palette.component';
import {FloorPlanInspectorComponent} from './components/floor-plan-inspector/floor-plan-inspector.component';
import {
    FloorPlanSettingsDialogComponent,
    SettingsResult
} from './components/floor-plan-settings-dialog/floor-plan-settings-dialog.component';

import {
    DEFAULT_ELEMENT_TYPES,
    defaultFloorPlanSettings,
    dimensionSizeOf,
    emptyFloorPlan,
    FloorElementType,
    formatSize,
    IFloorElement,
    IFloorLocation,
    IFloorPlan,
    IFloorPlanSettings,
    sortedDimensions
} from '../floor-plan.model';
import {
    angleTo,
    clamp,
    FREE_STEP,
    inside,
    normalizeAngle,
    PlacementOptions,
    placeAt,
    Point,
    Rect,
    round3,
    snapAngle
} from '../floor-plan.geometry';
import {
    applyRect,
    computeConflicts,
    conflictsById,
    FloorConflict,
    FloorObject,
    objectsOf
} from '../floor-plan.conflicts';

import {IStand} from '../../stand/model/stand.interface';
import {StandService} from '../../stand/service/stand.service';
import {SalonService} from '../../salon/service/salon.service';
import {ISalon} from '../../salon/model/salon.interface';
import {IPriceStandSalon} from '../../salon/model/price-stand-salon.interface';
import {Status} from '../../enumerations/status.model';
import {FloorPlanService} from '../service/floor-plan.service';
import {FloorPlanSettingsService} from '../service/floor-plan-settings.service';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {ActionsService} from '../../common/actions.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {getFormattedParticipationName} from '../../participation/model/participation.interface';
import {getExhibitorFullName, selectFilterExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {removeAccents} from '../../../shared/utils/string.util';

type DragMode = 'MOVE' | 'ROTATE' | 'RESIZE';

interface DragState {
    mode: DragMode;
    objectId: string;
    origin: Rect;
    start: Point;
    moved: boolean;
}

interface HistoryEntry {
    plans: IFloorPlan[];
    settings: IFloorPlanSettings;
    idsToDelete: string[];
}

const HISTORY_LIMIT = 100;
const MIN_PPM = 6;
const MAX_PPM = 90;

@Component({
               selector: 'floor-plan',
               templateUrl: './floor-plan-detail.component.html',
               styleUrl: './floor-plan-detail.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               imports: [
                   SharedModule,
                   RouterModule,
                   FormsModule,
                   ReactiveFormsModule,
                   TabsModule,
                   SelectButton,
                   InputNumber,
                   ContextMenu,
                   Textarea,
                   IftaLabel,
                   ContentPageComponent,
                   CardComponent,
                   ButtonBoxComponent,
                   MenuBoxComponent,
                   DialogBoxComponent,
                   SelectBoxComponent,
                   AlertErrorComponent,
                   FloorPlanCanvasComponent,
                   FloorPlanPaletteComponent,
                   FloorPlanInspectorComponent,
                   FloorPlanSettingsDialogComponent
               ]
           })
export class FloorPlanDetailComponent {
    private readonly destroyRef = inject(DestroyRef);
    private readonly route = inject(ActivatedRoute);
    private readonly salonService = inject(SalonService);
    private readonly standService = inject(StandService);
    private readonly floorPlanService = inject(FloorPlanService);
    private readonly floorPlanSettingsService = inject(FloorPlanSettingsService);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);
    private readonly messageService = inject(MessageService);
    private readonly translateService = inject(TranslateService);
    readonly navigationService = inject(NavigationStateService);

    readonly canvas = viewChild<FloorPlanCanvasComponent>('canvas');
    readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
    readonly contextMenu = viewChild<ContextMenu>('cm');

    // ------------------------------------------------------------------ état

    private readonly salonFromRoute = toSignal(
        this.route.data.pipe(map(data => data['salon'] as ISalon | undefined)),
        {initialValue: undefined}
    );
    readonly salon = computed(() => this.salonFromRoute() ?? undefined);

    readonly isLoading = signal(false);
    readonly isReadOnly = signal(true);

    readonly floorPlans = signal<IFloorPlan[]>([]);
    readonly settings = signal<IFloorPlanSettings>(defaultFloorPlanSettings());
    readonly activeIndex = signal(0);
    readonly floorPlansToRemove = signal<string[]>([]);

    readonly stands = signal<IStand[]>([]);
    readonly dimensions = signal<IPriceStandSalon[]>([]);

    readonly selectedId = signal<string | null>(null);
    readonly searchedId = signal<string | null>(null);
    readonly nextAngleDeg = signal(0);

    /** Repli manuel des panneaux, pour rendre de la largeur au plan. */
    readonly leftPanelCollapsed = signal(false);
    readonly rightPanelCollapsed = signal(false);

    readonly pixelsPerMeter = signal(30);
    readonly displayTechnical = signal(false);
    readonly displayFullname = signal(true);
    readonly displayHeader = signal(true);
    readonly snapEnabled = signal(true);
    readonly isNumberAttribution = signal(false);
    readonly automaticallyIncrementNumber = signal(true);
    readonly nextPosition = new FormControl<number | null>(1);

    readonly cursor = signal<Point | null>(null);
    readonly menuCache = signal<AppMenuItem[]>([]);
    readonly contextMenuItems = signal<MenuItem[]>([]);

    /** Sélecteur segmenté « Exposant / Technique », relocalisé au changement de langue. */
    private readonly currentLang = toSignal(this.translateService.onLangChange, {initialValue: null});
    readonly viewModeOptions = computed(() => {
        this.currentLang();
        return [
            {label: this.translateService.instant('floorPlan.view.exhibitor') as string, value: false},
            {label: this.translateService.instant('floorPlan.view.technical') as string, value: true}
        ];
    });

    readonly settingsDialogVisible = signal(false);
    readonly settingsDialogNewPlanName = signal<string | null>(null);
    readonly standDialogVisible = signal(false);
    readonly prereservedDialogVisible = signal(false);
    readonly searchDialogVisible = signal(false);
    readonly drawerOpen = signal(false);

    prereservedNote = '';
    private prereservedTargetId: string | null = null;
    readonly searchStandControl = new FormControl<IStand | null>(null);

    private drag: DragState | null = null;
    private history: HistoryEntry[] = [];
    private future: HistoryEntry[] = [];
    private readonly historyVersion = signal(0);

    // -------------------------------------------------------------- dérivés

    readonly activePlan = computed(() => this.floorPlans()[this.activeIndex()] ?? null);

    readonly standsById = computed(() => {
        const byId = new Map<string, IStand>();
        for (const stand of this.stands()) {
            byId.set(stand.id, stand);
        }
        return byId;
    });

    readonly assignedStandIds = computed(() => {
        const ids = new Set<string>();
        for (const plan of this.floorPlans()) {
            for (const location of plan.locations) {
                if (location.stand) {
                    ids.add(location.stand.id);
                }
            }
        }
        return ids;
    });

    /** Les stands annulés et refusés ne sont jamais proposés à la pose. */
    readonly placeableStands = computed(() =>
        this.stands().filter(stand => stand.status !== Status.CANCELED && stand.status !== Status.REFUSED)
    );

    readonly unassignedStands = computed(() => {
        const assigned = this.assignedStandIds();
        return this.placeableStands().filter(stand => !assigned.has(stand.id));
    });

    readonly assignedStands = computed(() => {
        const assigned = this.assignedStandIds();
        return this.placeableStands().filter(stand => assigned.has(stand.id));
    });

    readonly conflicts = computed<FloorConflict[]>(() => {
        const plan = this.activePlan();
        return plan ? computeConflicts(plan, this.settings()) : [];
    });

    readonly conflictsByObject = computed(() => conflictsById(this.conflicts()));

    readonly conflictCountByPlan = computed(() => {
        const settings = this.settings();
        return this.floorPlans().map(plan =>
            new Set(computeConflicts(plan, settings).map(conflict => conflict.objectId)).size
        );
    });

    readonly selectedObject = computed<FloorObject | null>(() => {
        const plan = this.activePlan();
        const id = this.selectedId();
        if (!plan || !id) {
            return null;
        }
        return objectsOf(plan).find(object => object.id === id) ?? null;
    });

    readonly selectedStand = computed(() => {
        const location = this.selectedObject()?.location;
        return location?.stand ? this.standsById().get(location.stand.id) ?? null : null;
    });

    readonly locationCount = computed(() => this.activePlan()?.locations.length ?? 0);
    readonly assignedCount = computed(() =>
        this.activePlan()?.locations.filter(location => !!location.stand).length ?? 0
    );
    readonly freeCount = computed(() => this.locationCount() - this.assignedCount());
    readonly conflictCount = computed(() => new Set(this.conflicts().map(item => item.objectId)).size);

    readonly canUndo = computed(() => this.historyVersion() >= 0 && this.history.length > 0);
    readonly canRedo = computed(() => this.historyVersion() >= 0 && this.future.length > 0);

    readonly stepsLabel = computed(() => {
        const settings = this.settings();
        return `${settings.gridMeter} m · ${settings.moveStepMeter} m · ${settings.rotationStepDeg}°`;
    });

    readonly displaySensibleInformation = computed(() => !this.navigationService.hideSensibleInformation());

    /** La palette n'a de sens qu'en édition. */
    readonly showLeftPanel = computed(() => !this.isReadOnly() && !this.leftPanelCollapsed());

    /**
     * En lecture, le panneau de droite reste ouvert sur la vue d'ensemble.
     * En édition, il ne s'ouvre qu'à la sélection d'un objet pour laisser la place au plan.
     */
    readonly showRightPanel = computed(() =>
        !this.rightPanelCollapsed() && (this.isReadOnly() || !!this.selectedObject())
    );

    constructor() {
        effect(() => {
            const salon = this.salon();
            if (salon?.id) {
                this.reloadFromServer(salon.id);
            }
        });

        fromEvent<KeyboardEvent>(window, 'keydown')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(event => this.onKeyDown(event));

        fromEvent<PointerEvent>(window, 'pointermove')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(event => this.onWindowPointerMove(event));

        fromEvent<PointerEvent>(window, 'pointerup')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.endDrag());

        this.searchStandControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(stand => this.applySearch(stand));
    }

    // ----------------------------------------------------------- chargement

    private reloadFromServer(salonId: string): void {
        this.isLoading.set(true);
        this.resetState();

        combineLatest([
                          this.standService.query({idSalon: salonId}).pipe(map(result => result ?? [])),
                          this.floorPlanService.load(salonId),
                          this.salonService.getDimensionStands(salonId),
                          this.floorPlanSettingsService.load(salonId)
                      ])
            .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
            .subscribe(([stands, plans, dimensions, settings]) => {
                this.stands.set(stands);
                this.dimensions.set(sortedDimensions(dimensions));
                this.settings.set(settings);
                this.floorPlans.set(plans.length ? plans : [emptyFloorPlan('Plan', 1)]);
                this.activeIndex.set(0);
                this.nextPosition.setValue(this.computeNextPosition());
                this.loadAvailableActions();
                setTimeout(() => this.fitToView());
            });
    }

    private resetState(): void {
        this.floorPlans.set([]);
        this.floorPlansToRemove.set([]);
        this.activeIndex.set(0);
        this.selectedId.set(null);
        this.searchedId.set(null);
        this.history = [];
        this.future = [];
        this.historyVersion.update(version => version + 1);
    }

    private computeNextPosition(): number {
        let max = 0;
        for (const plan of this.floorPlans()) {
            for (const location of plan.locations) {
                if (location.position != null && location.position > max) {
                    max = location.position;
                }
            }
        }
        return max + 1;
    }

    // ------------------------------------------------------------------ modes

    activateEditMode(): void {
        this.isReadOnly.set(false);
        this.leftPanelCollapsed.set(false);
        // Le plan est recadré une fois la nouvelle largeur du viewport appliquée.
        setTimeout(() => this.fitToView());
    }

    activateReadOnlyMode(): void {
        this.isReadOnly.set(true);
        this.selectedId.set(null);
        const salonId = this.salon()?.id;
        if (salonId) {
            this.reloadFromServer(salonId);
        }
    }

    save(): void {
        const salonId = this.salon()?.id;
        if (!salonId) {
            return;
        }

        this.isLoading.set(true);
        combineLatest([
                          this.floorPlanService.batchSave(salonId, this.floorPlans(), this.floorPlansToRemove()),
                          this.floorPlanSettingsService.save(salonId, this.settings())
                      ])
            .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
            .subscribe(([plans]) => {
                this.floorPlans.set(plans.length ? plans : [emptyFloorPlan('Plan', 1)]);
                this.floorPlansToRemove.set([]);
                this.activeIndex.set(Math.min(this.activeIndex(), Math.max(0, plans.length - 1)));
                this.isReadOnly.set(true);
                this.selectedId.set(null);
            });
    }

    previousState(): void {
        window.history.back();
    }

    // ----------------------------------------------------- mutation du plan

    /** Remplace le plan actif par une nouvelle référence, pour relancer le rendu. */
    private setActivePlan(plan: IFloorPlan): void {
        const plans = [...this.floorPlans()];
        plans[this.activeIndex()] = plan;
        this.floorPlans.set(plans);
    }

    private mutateActivePlan(mutator: (plan: IFloorPlan) => void, snapshot = true): void {
        const current = this.activePlan();
        if (!current) {
            return;
        }
        if (snapshot) {
            this.pushHistory();
        }
        const draft: IFloorPlan = {
            ...current,
            locations: current.locations.map(location => ({...location})),
            elements: current.elements.map(element => ({...element}))
        };
        mutator(draft);
        this.setActivePlan(draft);
    }

    // -------------------------------------------------------------- historique

    private snapshot(): HistoryEntry {
        return {
            plans: structuredClone(this.floorPlans()),
            settings: structuredClone(this.settings()),
            idsToDelete: [...this.floorPlansToRemove()]
        };
    }

    private pushHistory(): void {
        this.history.push(this.snapshot());
        if (this.history.length > HISTORY_LIMIT) {
            this.history.shift();
        }
        this.future = [];
        this.historyVersion.update(version => version + 1);
    }

    undo(): void {
        const entry = this.history.pop();
        if (!entry) {
            return;
        }
        this.future.push(this.snapshot());
        this.restore(entry);
    }

    redo(): void {
        const entry = this.future.pop();
        if (!entry) {
            return;
        }
        this.history.push(this.snapshot());
        this.restore(entry);
    }

    private restore(entry: HistoryEntry): void {
        this.floorPlans.set(entry.plans);
        this.settings.set(entry.settings);
        this.floorPlansToRemove.set(entry.idsToDelete);
        this.activeIndex.set(Math.min(this.activeIndex(), Math.max(0, entry.plans.length - 1)));
        this.historyVersion.update(version => version + 1);
    }

    // ------------------------------------------------------------- placement

    private placementOptions(excludeId?: string): PlacementOptions {
        const plan = this.activePlan();
        const settings = this.settings();
        return {
            moveStepMeter: settings.moveStepMeter,
            snapEnabled: this.snapEnabled(),
            magnetEnabled: settings.magnet,
            planWidthMeter: plan?.widthMeter ?? 0,
            planHeightMeter: plan?.heightMeter ?? 0,
            neighbours: plan
                        ? objectsOf(plan)
                            .filter(object => object.id !== excludeId)
                            .map(object => object.rect)
                        : []
        };
    }

    onNextAngleChanged(angle: number): void {
        this.nextAngleDeg.set(angle);
    }

    /** Le glissé depuis la palette referme le tiroir mobile pour dégager le plan. */
    onPaletteDragStarted(): void {
        this.drawerOpen.set(false);
    }

    /** Dépôt d'une carte de la palette sur le plan. */
    onPaletteDropped(drop: PaletteDrop): void {
        const canvas = this.canvas();
        const plan = this.activePlan();
        if (!canvas || !plan) {
            return;
        }

        const point = canvas.clientToPlanPoint(drop.clientX, drop.clientY);
        if (!canvas.containsPlanPoint(point)) {
            return;
        }

        this.placeTemplate(drop.template, point);
    }

    private placeTemplate(template: PaletteTemplate, point: Point): void {
        const plan = this.activePlan();
        if (!plan) {
            return;
        }

        if (template.kind === 'EXHIBITOR') {
            // Sur un emplacement libre, l'exposant y est attribué ; ailleurs, un stand est créé.
            const target = objectsOf(plan).find(object =>
                object.location && !object.location.stand && inside(point, object.rect)
            );
            if (target?.location) {
                this.assignStandTo(target.location.id, template.stand);
            } else if (template.stand.dimension) {
                this.createLocation(template.stand.dimension, point, template.stand);
            }
            return;
        }

        if (template.kind === 'DIMENSION') {
            this.createLocation(template.dimension, point, null);
            return;
        }

        this.createElement(template.type, point);
    }

    private createLocation(dimension: IPriceStandSalon, point: Point, stand: IStand | null): void {
        const size = dimensionSizeOf(dimension);
        const rect: Rect = {
            x: point.x - size.widthMeter / 2,
            y: point.y - size.depthMeter / 2,
            w: size.widthMeter,
            h: size.depthMeter,
            rot: this.nextAngleDeg()
        };
        placeAt(rect, point.x, point.y, this.placementOptions());

        const location: IFloorLocation = {
            id: uuid(),
            idDimension: dimension.id,
            centerX: round3(rect.x + rect.w / 2),
            centerY: round3(rect.y + rect.h / 2),
            widthMeter: rect.w,
            depthMeter: rect.h,
            rotationDeg: rect.rot ?? 0,
            position: null,
            stand: stand ? {id: stand.id} : null,
            prereserved: null
        };

        this.mutateActivePlan(plan => plan.locations.push(location));
        this.selectedId.set(location.id);
    }

    private createElement(type: FloorElementType, point: Point): void {
        const setting = this.settings().elementTypes[type] ?? DEFAULT_ELEMENT_TYPES[type];
        const rect: Rect = {
            x: point.x - setting.widthMeter / 2,
            y: point.y - setting.depthMeter / 2,
            w: setting.widthMeter,
            h: setting.depthMeter,
            rot: this.nextAngleDeg()
        };
        placeAt(rect, point.x, point.y, this.placementOptions());

        const element: IFloorElement = {
            id: uuid(),
            type,
            label: null,
            centerX: round3(rect.x + rect.w / 2),
            centerY: round3(rect.y + rect.h / 2),
            widthMeter: rect.w,
            depthMeter: rect.h,
            rotationDeg: rect.rot ?? 0,
            blockingOverride: null
        };

        this.mutateActivePlan(plan => plan.elements.push(element));
        this.selectedId.set(element.id);
    }

    // ----------------------------------------------------------- interactions

    onCanvasPointerDownOnObject(payload: { event: PointerEvent; object: FloorObject }): void {
        const {event, object} = payload;
        const canvas = this.canvas();
        if (!canvas) {
            return;
        }

        this.selectedId.set(object.id);

        if (this.isNumberAttribution() && object.location) {
            this.applyNextPosition(object.location.id);
            return;
        }

        if (this.isReadOnly()) {
            return;
        }

        this.drag = {
            mode: 'MOVE',
            objectId: object.id,
            origin: {...object.rect},
            start: canvas.toPlanPoint(event),
            moved: false
        };
    }

    onCanvasPointerDownOnBackground(_event: PointerEvent): void {
        this.selectedId.set(null);
    }

    onRotationHandleDown(payload: { event: PointerEvent; object: FloorObject }): void {
        const canvas = this.canvas();
        if (!canvas) {
            return;
        }
        this.drag = {
            mode: 'ROTATE',
            objectId: payload.object.id,
            origin: {...payload.object.rect},
            start: canvas.toPlanPoint(payload.event),
            moved: false
        };
    }

    onResizeHandleDown(payload: { event: PointerEvent; object: FloorObject }): void {
        const canvas = this.canvas();
        if (!canvas) {
            return;
        }
        this.drag = {
            mode: 'RESIZE',
            objectId: payload.object.id,
            origin: {...payload.object.rect},
            start: canvas.toPlanPoint(payload.event),
            moved: false
        };
    }

    onCanvasPointerMoved(payload: { event: PointerEvent; point: Point }): void {
        this.cursor.set(payload.point);
    }

    private onWindowPointerMove(event: PointerEvent): void {
        const drag = this.drag;
        const canvas = this.canvas();
        if (!drag || !canvas) {
            return;
        }

        const point = canvas.toPlanPoint(event);
        if (!drag.moved) {
            this.pushHistory();
            drag.moved = true;
        }

        const settings = this.settings();
        const rect: Rect = {...drag.origin};

        if (drag.mode === 'MOVE') {
            const centerX = drag.origin.x + drag.origin.w / 2 + (point.x - drag.start.x);
            const centerY = drag.origin.y + drag.origin.h / 2 + (point.y - drag.start.y);
            placeAt(rect, centerX, centerY, this.placementOptions(drag.objectId));
        } else if (drag.mode === 'ROTATE') {
            const center = {x: drag.origin.x + drag.origin.w / 2, y: drag.origin.y + drag.origin.h / 2};
            rect.rot = snapAngle(angleTo(center, point) + 90, settings.rotationStepDeg, event.shiftKey);
        } else {
            rect.w = round3(Math.max(0.1, point.x - drag.origin.x));
            // Un mur ne change que de longueur.
            const isWall = this.selectedObject()?.element?.type === 'WALL';
            rect.h = isWall ? drag.origin.h : round3(Math.max(0.1, point.y - drag.origin.y));
        }

        this.applyRectToObject(drag.objectId, rect, false);
    }

    private endDrag(): void {
        this.drag = null;
    }

    private applyRectToObject(objectId: string, rect: Rect, snapshot = true): void {
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === objectId);
            if (location) {
                applyRect(location, rect);
                return;
            }
            const element = plan.elements.find(item => item.id === objectId);
            if (element) {
                applyRect(element, rect);
            }
        }, snapshot);
    }

    onContextMenuRequested(payload: { event: MouseEvent; object: FloorObject }): void {
        if (this.isReadOnly()) {
            return;
        }
        this.selectedId.set(payload.object.id);
        this.contextMenuItems.set(this.buildContextMenuItems(payload.object));
        this.contextMenu()?.show(payload.event);
    }

    private buildContextMenuItems(object: FloorObject): MenuItem[] {
        const items: MenuItem[] = [];
        const location = object.location;

        if (location) {
            if (!location.stand) {
                const available = this.unassignedStands();
                if (available.length) {
                    items.push({
                                   label: 'Attribuer à...',
                                   icon: `${PrimeIcons.USER_PLUS} text-success`,
                                   items: available.map(stand => ({
                                       label: getFormattedParticipationName(stand.participation),
                                       icon: stand.dimension?.id === location.idDimension
                                             ? `${PrimeIcons.VERIFIED} text-success`
                                             : `${PrimeIcons.EXCLAMATION_CIRCLE} text-warning`,
                                       command: () => this.assignStandTo(location.id, stand)
                                   }))
                               });
                } else {
                    items.push({label: 'Aucun stand disponible', icon: PrimeIcons.USER, disabled: true});
                }
            } else {
                items.push({
                               label: 'Désattribuer',
                               icon: `${PrimeIcons.USER_MINUS} text-warning`,
                               command: () => this.releaseStand(location.id)
                           });
            }

            if (location.prereserved) {
                items.push({
                               label: 'Annuler la réservation',
                               icon: `${PrimeIcons.TAG} text-warning`,
                               command: () => this.cancelPrereservation(location.id)
                           });
            } else if (!location.stand) {
                items.push({
                               label: 'Réserver la place...',
                               icon: `${PrimeIcons.TAG} text-success`,
                               command: () => this.openPrereservedDialog(location.id)
                           });
            }

            items.push({
                           label: 'Détail de l\'emplacement',
                           icon: PrimeIcons.INFO_CIRCLE,
                           command: () => this.standDialogVisible.set(true)
                       });
        }

        items.push({label: 'Dupliquer', icon: PrimeIcons.COPY, command: () => this.duplicateSelected()});
        items.push({
                       label: 'Supprimer l\'emplacement',
                       icon: `${PrimeIcons.TRASH} text-danger`,
                       styleClass: 'p-menuitem-danger',
                       command: () => this.deleteSelected()
                   });

        return items;
    }

    // -------------------------------------------------- actions sur l'objet

    assignStandTo(locationId: string, stand: IStand): void {
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === locationId);
            if (location) {
                location.stand = {id: stand.id};
                location.prereserved = null;
            }
        });
    }

    onStandAssigned(stand: IStand): void {
        const id = this.selectedId();
        if (id) {
            this.assignStandTo(id, stand);
        }
    }

    releaseStand(locationId: string | null = this.selectedId()): void {
        if (!locationId) {
            return;
        }
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === locationId);
            if (location) {
                location.stand = null;
            }
        });
    }

    duplicateSelected(): void {
        const object = this.selectedObject();
        if (!object) {
            return;
        }

        // La copie est posée dans la direction de la grande longueur.
        const rect: Rect = {...object.rect};
        const alongWidth = rect.w >= rect.h;
        const centerX = rect.x + rect.w / 2 + (alongWidth ? rect.w : 0);
        const centerY = rect.y + rect.h / 2 + (alongWidth ? 0 : rect.h);
        placeAt(rect, centerX, centerY, this.placementOptions());

        const newId = uuid();
        const nextPosition = this.computeNextPosition();

        this.mutateActivePlan(draft => {
            if (object.location) {
                const copy: IFloorLocation = {
                    ...object.location,
                    id: newId,
                    stand: null,
                    prereserved: null,
                    position: nextPosition
                };
                applyRect(copy, rect);
                draft.locations.push(copy);
            } else if (object.element) {
                const copy: IFloorElement = {...object.element, id: newId};
                applyRect(copy, rect);
                draft.elements.push(copy);
            }
        });

        this.selectedId.set(newId);
    }

    deleteSelected(): void {
        const id = this.selectedId();
        if (!id) {
            return;
        }
        this.mutateActivePlan(plan => {
            plan.locations = plan.locations.filter(location => location.id !== id);
            plan.elements = plan.elements.filter(element => element.id !== id);
        });
        this.selectedId.set(null);
    }

    rotateSelected(deltaDeg: number): void {
        const object = this.selectedObject();
        if (!object) {
            return;
        }
        this.applyRectToObject(object.id, {
            ...object.rect,
            rot: normalizeAngle((object.rect.rot ?? 0) + deltaDeg)
        });
    }

    setSelectedAngle(angle: number): void {
        const object = this.selectedObject();
        if (object) {
            this.applyRectToObject(object.id, {...object.rect, rot: normalizeAngle(angle)});
        }
    }

    moveSelected(dx: number, dy: number): void {
        const object = this.selectedObject();
        if (!object) {
            return;
        }
        const rect: Rect = {...object.rect};
        placeAt(rect, rect.x + rect.w / 2 + dx, rect.y + rect.h / 2 + dy, this.placementOptions(object.id));
        this.applyRectToObject(object.id, rect);
    }

    onPositionChanged(position: number | null): void {
        const id = this.selectedId();
        if (!id) {
            return;
        }
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === id);
            if (location) {
                location.position = position;
            }
        });
    }

    onDimensionChanged(dimension: IPriceStandSalon): void {
        const id = this.selectedId();
        if (!id) {
            return;
        }
        const size = dimensionSizeOf(dimension);
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === id);
            if (location) {
                location.idDimension = dimension.id;
                location.widthMeter = size.widthMeter;
                location.depthMeter = size.depthMeter;
            }
        });
    }

    onElementTypeChanged(type: FloorElementType): void {
        const id = this.selectedId();
        if (!id) {
            return;
        }
        this.mutateActivePlan(plan => {
            const element = plan.elements.find(item => item.id === id);
            if (element) {
                element.type = type;
            }
        });
    }

    onElementLabelChanged(label: string): void {
        const id = this.selectedId();
        if (!id) {
            return;
        }
        this.mutateActivePlan(plan => {
            const element = plan.elements.find(item => item.id === id);
            if (element) {
                element.label = label.trim() || null;
            }
        });
    }

    onElementSizeChanged(size: { widthMeter: number; depthMeter: number }): void {
        const object = this.selectedObject();
        if (object) {
            this.applyRectToObject(object.id, {
                ...object.rect,
                w: Math.max(0.1, size.widthMeter),
                h: Math.max(0.1, size.depthMeter)
            });
        }
    }

    onBlockingChanged(blocking: boolean | null): void {
        const id = this.selectedId();
        if (!id) {
            return;
        }
        this.mutateActivePlan(plan => {
            const element = plan.elements.find(item => item.id === id);
            if (!element) {
                return;
            }
            const defaultBlocking = this.settings().elementTypes[element.type].blocking;
            element.blockingOverride = blocking == null || blocking === defaultBlocking ? null : blocking;
        });
    }

    // ------------------------------------------------------ pré-réservation

    openPrereservedDialog(locationId: string): void {
        this.prereservedTargetId = locationId;
        this.prereservedNote = '';
        this.prereservedDialogVisible.set(true);
    }

    canConfirmPrereserved(): boolean {
        return this.prereservedNote.trim().length > 0;
    }

    confirmPrereserved(): void {
        const id = this.prereservedTargetId;
        const note = this.prereservedNote.trim();
        if (!id || !note) {
            return;
        }
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === id);
            if (location) {
                location.prereserved = {note};
            }
        });
        this.prereservedDialogVisible.set(false);
        this.prereservedTargetId = null;
        this.prereservedNote = '';
    }

    cancelPrereservation(locationId: string): void {
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === locationId);
            if (location) {
                location.prereserved = null;
            }
        });
    }

    // --------------------------------------------------------- numérotation

    private applyNextPosition(locationId: string): void {
        const position = this.nextPosition.value;
        if (position == null) {
            return;
        }
        this.mutateActivePlan(plan => {
            const location = plan.locations.find(item => item.id === locationId);
            if (location) {
                location.position = position;
            }
        });
        if (this.automaticallyIncrementNumber()) {
            this.nextPosition.setValue(position + 1);
        }
    }

    // ------------------------------------------------------------ recherche

    private applySearch(stand: IStand | null): void {
        if (!stand) {
            this.searchedId.set(null);
            return;
        }

        const plans = this.floorPlans();
        for (let index = 0; index < plans.length; index++) {
            const location = plans[index].locations.find(item => item.stand?.id === stand.id);
            if (location) {
                this.activeIndex.set(index);
                this.selectedId.set(location.id);
                this.searchedId.set(location.id);
                this.searchDialogVisible.set(false);
                setTimeout(() => this.centerOn(location.id));
                return;
            }
        }
    }

    focusConflict(objectId: string): void {
        this.selectedId.set(objectId);
        this.centerOn(objectId);
    }

    nextConflict(): void {
        const ids = [...new Set(this.conflicts().map(conflict => conflict.objectId))];
        if (!ids.length) {
            return;
        }
        const current = this.selectedId();
        const index = current ? ids.indexOf(current) : -1;
        this.focusConflict(ids[(index + 1) % ids.length]);
    }

    private centerOn(objectId: string): void {
        const canvas = this.canvas();
        const viewport = this.viewport()?.nativeElement;
        const center = canvas?.centerOf(objectId);
        if (!canvas || !viewport || !center) {
            return;
        }

        const ppm = this.pixelsPerMeter();
        const ruler = canvas.rulerMeter();
        viewport.scrollLeft = (center.x + ruler) * ppm - viewport.clientWidth / 2;
        viewport.scrollTop = (center.y + ruler) * ppm - viewport.clientHeight / 2;
    }

    // ----------------------------------------------------------------- zoom

    zoom(factor: number): void {
        this.pixelsPerMeter.update(ppm => clamp(Math.round(ppm * factor), MIN_PPM, MAX_PPM));
    }

    fitToView(): void {
        const viewport = this.viewport()?.nativeElement;
        const plan = this.activePlan();
        if (!viewport || !plan) {
            return;
        }
        const ppm = Math.min(
            (viewport.clientWidth - 60) / Math.max(plan.widthMeter, 1),
            (viewport.clientHeight - 60) / Math.max(plan.heightMeter, 1)
        );
        this.pixelsPerMeter.set(clamp(Math.floor(ppm), MIN_PPM, MAX_PPM));
    }

    onWheel(event: WheelEvent): void {
        if (!event.ctrlKey) {
            return;
        }
        event.preventDefault();
        this.zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    }

    // -------------------------------------------------------------- onglets

    selectPlan(index: number): void {
        this.activeIndex.set(index);
        this.selectedId.set(null);
    }

    openSettingsDialog(newPlanName: string | null = null): void {
        this.settingsDialogNewPlanName.set(newPlanName);
        this.settingsDialogVisible.set(true);
    }

    onSettingsApplied(result: SettingsResult): void {
        if (!result) {
            return;
        }

        this.pushHistory();
        this.settings.set(result.settings);
        this.floorPlans.set(result.plans.length ? result.plans : [emptyFloorPlan('Plan', 1)]);
        this.floorPlansToRemove.update(ids => [...ids, ...result.idsToDelete]);
        this.activeIndex.set(Math.min(this.activeIndex(), Math.max(0, result.plans.length - 1)));
        this.selectedId.set(null);

        const details: string[] = [];
        if (this.conflictCount() > 0) {
            details.push(`${this.conflictCount()} conflit(s) à revoir`);
        }
        if (result.displacedStands > 0) {
            details.push(`${result.displacedStands} exposant(s) à replacer`);
        }

        this.messageService.add({
                                    severity: 'success',
                                    summary: 'Réglages appliqués',
                                    detail: details.join(' · ') || undefined
                                });
    }

    // -------------------------------------------------------------- clavier

    private onKeyDown(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest('input, textarea, select, [contenteditable="true"], .p-dialog')) {
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ') {
            event.preventDefault();
            this.undo();
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyY') {
            event.preventDefault();
            this.redo();
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyD') {
            event.preventDefault();
            this.duplicateSelected();
            return;
        }

        if (event.code === 'Escape') {
            this.selectedId.set(null);
            return;
        }

        if (event.code === 'KeyT') {
            this.displayTechnical.update(value => !value);
            return;
        }

        if (this.isReadOnly() || !this.selectedId()) {
            return;
        }

        const settings = this.settings();
        const step = event.altKey ? FREE_STEP : settings.moveStepMeter;

        switch (event.code) {
            case 'Delete':
            case 'Backspace':
                event.preventDefault();
                this.deleteSelected();
                break;
            case 'KeyR':
                event.preventDefault();
                this.rotateSelected(90);
                break;
            case 'KeyQ':
                event.preventDefault();
                this.rotateSelected(-settings.rotationStepDeg);
                break;
            case 'KeyE':
                event.preventDefault();
                this.rotateSelected(settings.rotationStepDeg);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.moveSelected(-step, 0);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.moveSelected(step, 0);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.moveSelected(0, -step);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.moveSelected(0, step);
                break;
            default:
                break;
        }
    }

    // --------------------------------------------------------- menu Actions

    private loadAvailableActions(): void {
        const salonId = this.salon()?.id;
        if (!salonId) {
            return;
        }
        this.actionsService.getAvailableActions('salon', salonId, 'floor-plan')
            .subscribe(actions => this.menuCache.set(this.buildActionsMenu(actions)));
    }

    private buildActionsMenu(availableActions: AvailableAction[]): AppMenuItem[] {
        return this.menuItemBuilderService.buildMenuItemsFromActions(
            availableActions,
            (action, htmlElement) => this.clickAction(action, htmlElement)
        );
    }

    clickAction(action: AvailableAction, _htmlElement?: HTMLElement): void {
        if (action.type !== 'DOWNLOAD') {
            return;
        }
        const salonId = this.salon()?.id;
        if (!salonId) {
            return;
        }

        this.isLoading.set(true);
        this.actionsService.downloadAction(action.contextCode, salonId)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(response => {
                const disposition = response.headers.get('content-disposition') ?? '';
                const filename = this.getFilenameFromContentDisposition(disposition) ?? 'document.pdf';
                const url = window.URL.createObjectURL(response.body!);

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();

                window.URL.revokeObjectURL(url);
            });
    }

    private getFilenameFromContentDisposition(contentDisposition: string): string | null {
        if (!contentDisposition) {
            return null;
        }
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        return matches?.[1] ? matches[1].replace(/['"]/g, '') : null;
    }

    toggleSensibleInformation(): void {
        this.navigationService.hideSensibleInformation.update(value => !value);
    }

    participationLink(stand: IStand, page: 'view' | 'invoicing-plans'): string[] {
        return ['/salons', this.salon()?.id ?? '', 'participations', stand.participation?.id ?? '', page];
    }

    protected readonly formatSize = formatSize;
    protected readonly formatterStand = (stand: IStand): string =>
        removeAccents(getFormattedParticipationName(stand?.participation));
    protected readonly selectFilterStand = (): string =>
        `participation.therapistName,participation.exhibitor.${selectFilterExhibitor().split(',').join(',exhibitor.')}`;
    protected readonly getExhibitorFullName = getExhibitorFullName;
    protected readonly getFormattedParticipationName = getFormattedParticipationName;
}
