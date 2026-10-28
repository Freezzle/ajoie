import {ChangeDetectionStrategy, Component, computed, effect, inject, input, LOCALE_ID, OnInit, signal, untracked, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {formatDate} from '@angular/common';

import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {FileUpload, FileUploadHandlerEvent} from 'primeng/fileupload';

import SharedModule from 'app/shared/shared.module';
import {CardComponent} from '../../../shared/components/card/card.component';
import {ContentPageComponent} from '../../../shared/components/content-page/content-page.component';
import {ButtonBoxComponent} from '../../../shared/components/button-box/button-box.component';
import {MenuBoxComponent} from '../../../shared/components/menu-box/menu-box.component';
import {NavigationStateService} from '../../../layouts/navbar/navigation-state.service';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';

import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {ParticipationService} from '../../participation/service/participation.service';
import {TaskInstanceService} from '../../task/service/task-instance.service';
import {VolunteerPlanningService} from '../../volunteer-planning/volunteer-planning.service';
import {FloorPlanService} from '../../floor-plan/service/floor-plan.service';
import {planningFromDto} from '../../volunteer-planning/components/volunteer-planning-utils';

import {Status} from '../../enumerations/status.model';
import {ISalonStats} from '../model/salon-stats.interface';
import {ISalonDashboard} from '../model/salon-dashboard.interface';
import {IParticipationList} from '../../participation/model/participation.interface';
import {ITaskInstance} from '../../task/model/task-instance.interface';
import {IFloorPlan} from '../../floor-plan/floor-plan.model';
import {TalkPlanningSaveDto} from '../../talks-planning/update/talks-planning-model';
import {Category, Day} from '../../volunteer-planning/components/volunteer-planning-model';

import {
    buildLineChart,
    buildMetric,
    buildTimeline,
    buildTodo,
    DashboardContext,
    LineChart,
    MetricStatusType,
    MetricVM
} from './salon-dashboard.utils';
import {
    DashboardSource,
    DashboardTheme,
    DEFAULT_METRICS,
    groupMetricsByTheme,
    METRIC_BY_ID,
    METRIC_COUNT,
    METRIC_DEFS,
    MetricDef,
    sanitizeMetrics,
    sourcesFor,
    THEME_ICON,
    THEME_ORDER
} from './salon-dashboard.metrics';

type DashboardView = 'dashboard' | 'catalogue';

const STORAGE_KEY = 'salon-dashboard.metrics';

@Component({
    selector: 'app-salon-stats',
    templateUrl: './salon-stats.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SharedModule,
        RouterModule,
        ToastModule,
        FileUpload,
        CardComponent,
        ContentPageComponent,
        ButtonBoxComponent,
        MenuBoxComponent
    ]
})
export class SalonStatsComponent implements OnInit {
    @ViewChild('fileUploader') fileUploader!: FileUpload;

    readonly salon = input<ISalon | null>(null);

    readonly navigationService = inject(NavigationStateService);
    private readonly salonService = inject(SalonService);
    private readonly participationService = inject(ParticipationService);
    private readonly taskInstanceService = inject(TaskInstanceService);
    private readonly volunteerPlanningService = inject(VolunteerPlanningService);
    private readonly floorPlanService = inject(FloorPlanService);
    private readonly messageService = inject(MessageService);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly locale = inject(LOCALE_ID);

    // ── Vue (?view=) et thème du catalogue (?theme=) ────────────────────────
    readonly view = signal<DashboardView>('dashboard');
    readonly catalogueTheme = signal<DashboardTheme | 'all'>('all');

    // ── Choix des métriques affichées ───────────────────────────────────────
    readonly chosen = signal<string[]>(sanitizeMetrics(DEFAULT_METRICS));

    // ── Données chargées en parallèle ───────────────────────────────────────
    readonly participations = signal<IParticipationList[]>([]);
    readonly statsVerification = signal<ISalonStats | null>(null);
    readonly statsConfirmed = signal<ISalonStats | null>(null);
    readonly statsDiscarded = signal<ISalonStats | null>(null);
    readonly dashboard = signal<ISalonDashboard | null>(null);
    readonly tasks = signal<ITaskInstance[]>([]);
    readonly floorPlans = signal<IFloorPlan[]>([]);
    readonly talks = signal<TalkPlanningSaveDto[]>([]);
    readonly volunteerDays = signal<Day[]>([]);
    readonly volunteerCategories = signal<Category[]>([]);

    private readonly loadedSources = new Set<DashboardSource>();
    private readonly loadingSources = new Set<DashboardSource>();

    /** Sélecteur de type pour la carte « État actuel ». */
    readonly statusType = signal<MetricStatusType>('participation');
    /** Largeur d'affichage courante pour choisir la hauteur des graphiques. */
    readonly isMobile = signal<boolean>(typeof window !== 'undefined' && window.innerWidth <= 720);
    /** Semaine survolée dans la chronologie. */
    readonly hovered = signal<number | null>(null);

    protected readonly themeOrder = THEME_ORDER;
    protected readonly themeIcon = THEME_ICON;
    protected readonly metricCount = METRIC_COUNT;

    protected readonly statusTypes: {type: MetricStatusType; shortKey: string}[] = [
        {type: 'participation', shortKey: 'salon.dashboard.status.shortParticipation'},
        {type: 'stand', shortKey: 'salon.dashboard.status.shortStand'},
        {type: 'conference', shortKey: 'salon.dashboard.status.shortConference'},
        {type: 'workshop', shortKey: 'salon.dashboard.status.shortWorkshop'}
    ];

    constructor() {
        const snapshot = this.activatedRoute.snapshot.queryParamMap;
        if (snapshot.get('view') === 'catalogue') {
            this.view.set('catalogue');
        }
        const theme = snapshot.get('theme');
        if (theme && THEME_ORDER.includes(theme as DashboardTheme)) {
            this.catalogueTheme.set(theme as DashboardTheme);
        }

        // Garde la vue dans l'URL, comme task-focus-list.
        effect(() => {
            const current = this.view();
            untracked(() => void this.router.navigate([], {
                relativeTo: this.activatedRoute,
                queryParams: {view: current === 'catalogue' ? 'catalogue' : null},
                queryParamsHandling: 'merge',
                replaceUrl: true
            }));
        });

        // Charge les sources nécessaires dès que la vue ou le choix change.
        effect(() => {
            const needed = this.view() === 'catalogue'
                ? new Set<DashboardSource>(METRIC_DEFS.flatMap(def => def.sources))
                : sourcesFor(this.chosen());
            // La chronologie et « À traiter » ont toujours besoin de ces sources.
            needed.add('participations');
            needed.add('stats');
            needed.add('dashboard');
            needed.add('tasks');
            untracked(() => this.ensureSources(needed));
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.isMobile.set(window.innerWidth <= 720));
        }
    }

    ngOnInit(): void {
        const idSalon = this.salon()?.id;
        if (!idSalon) {
            return;
        }
        this.loadChosenMetrics(idSalon);
    }

    // ── En-tête ─────────────────────────────────────────────────────────────

    readonly salonSubline = computed(() => {
        const salon = this.salon();
        if (!salon) {
            return '';
        }
        const dates = salon.startingDate
            ? formatDate(salon.startingDate, 'dd.MM.yyyy', this.locale)
            + (salon.endingDate ? ' – ' + formatDate(salon.endingDate, 'dd.MM.yyyy', this.locale) : '')
            : '';
        return [salon.place, dates].filter(part => !!part).join(' · ');
    });

    readonly menuItems = computed<AppMenuItem[]>(() => {
        if (this.view() === 'catalogue') {
            return [{
                label: 'salon.dashboard.goDashboard',
                icon: 'pi pi-chart-bar',
                command: () => this.view.set('dashboard')
            }];
        }
        return [{
            label: 'salon.dashboard.goCatalogue',
            icon: 'pi pi-th-large',
            command: () => this.view.set('catalogue')
        }];
    });

    // ── Contexte des métriques ──────────────────────────────────────────────

    readonly context = computed<DashboardContext>(() => ({
        participations: this.participations(),
        statsVerification: this.statsVerification(),
        statsConfirmed: this.statsConfirmed(),
        statsDiscarded: this.statsDiscarded(),
        dashboard: this.dashboard(),
        tasks: this.tasks(),
        floorPlans: this.floorPlans(),
        talks: this.talks(),
        volunteerDays: this.volunteerDays(),
        volunteerCategories: this.volunteerCategories()
    }));

    // ── Chronologie ─────────────────────────────────────────────────────────

    readonly timeline = computed(() => buildTimeline(this.participations(), this.dashboard()?.payments ?? []));

    readonly timelineSub = computed(() => {
        const timeline = this.timeline();
        if (!timeline) {
            return null;
        }
        return {
            start: formatDate(timeline.startDate, 'dd.MM.yyyy', this.locale),
            end: formatDate(timeline.endDate, 'dd.MM.yyyy', this.locale)
        };
    });

    readonly expectedAmount = computed(() => this.statsConfirmed()?.facturation.expected ?? 0);
    readonly paidAmount = computed(() => this.statsConfirmed()?.facturation.paid ?? 0);
    readonly remainingAmount = computed(() => this.statsConfirmed()?.facturation.remaining ?? 0);
    readonly paidPct = computed(() => {
        const expected = this.expectedAmount();
        return expected > 0 ? Math.round((this.paidAmount() / expected) * 100) : 0;
    });

    readonly registrationsChart = computed<LineChart | null>(() => {
        const timeline = this.timeline();
        if (!timeline) {
            return null;
        }
        return buildLineChart(timeline.weeks, timeline.weeks.map(week => week.registrations), {
            width: 600,
            height: this.isMobile() ? 190 : 150,
            amount: false,
            color: 'var(--app-accent)',
            locale: this.locale
        });
    });

    readonly paymentsChart = computed<LineChart | null>(() => {
        const timeline = this.timeline();
        if (!timeline) {
            return null;
        }
        return buildLineChart(timeline.weeks, timeline.weeks.map(week => week.payments), {
            width: 600,
            height: this.isMobile() ? 190 : 170,
            amount: true,
            expected: this.expectedAmount(),
            monthLabels: true,
            color: 'var(--app-status-validated)',
            locale: this.locale
        });
    });

    readonly hoveredWeek = computed(() => {
        const index = this.hovered();
        const timeline = this.timeline();
        if (index === null || !timeline || index < 0 || index >= timeline.weeks.length) {
            return null;
        }
        return timeline.weeks[index];
    });

    readonly hoveredWeekLabel = computed(() => {
        const week = this.hoveredWeek();
        return week ? formatDate(week.start, 'dd.MM.yyyy', this.locale) : '';
    });

    onChartMove(event: MouseEvent, chart: LineChart | null): void {
        const timeline = this.timeline();
        if (!chart || !timeline || timeline.weeks.length === 0) {
            return;
        }
        const target = event.currentTarget as SVGGraphicsElement;
        const rect = target.getBoundingClientRect();
        const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
        const x = ratio * chart.width;
        const span = chart.width - chart.left - chart.right;
        const count = timeline.weeks.length;
        const raw = span > 0 ? ((x - chart.left) / span) * (count - 1) : 0;
        this.hovered.set(Math.max(0, Math.min(count - 1, Math.round(raw))));
    }

    onChartLeave(): void {
        this.hovered.set(null);
    }

    hoverX(chart: LineChart | null): number {
        const index = this.hovered();
        if (!chart || index === null || index >= chart.points.length) {
            return 0;
        }
        return chart.points[index].x;
    }

    hoverY(chart: LineChart | null): number {
        const index = this.hovered();
        if (!chart || index === null || index >= chart.points.length) {
            return 0;
        }
        return chart.points[index].y;
    }

    // ── À traiter ───────────────────────────────────────────────────────────

    readonly todo = computed(() => buildTodo(this.participations(), this.tasks()));

    // ── Mes indicateurs ─────────────────────────────────────────────────────

    readonly zones = computed(() => groupMetricsByTheme(this.chosen()).map(zone => ({
        theme: zone.theme,
        ids: zone.ids,
        cols: zone.ids.length >= 4 ? 4 : zone.ids.length,
        wide: zone.ids.length >= 3
    })));

    readonly hasChosen = computed(() => this.chosen().length > 0);

    metric(id: string): MetricVM | null {
        const def = METRIC_BY_ID[id];
        return def ? buildMetric(id, this.context(), def.visual) : null;
    }

    // ── Catalogue ───────────────────────────────────────────────────────────

    readonly catalogueSections = computed(() => {
        const selected = this.catalogueTheme();
        return THEME_ORDER
            .filter(theme => selected === 'all' || selected === theme)
            .map(theme => ({
                theme,
                defs: METRIC_DEFS.filter(def => def.theme === theme)
            }));
    });

    isShown(id: string): boolean {
        return this.chosen().includes(id);
    }

    // ── Choix : ajout, retrait, persistance ─────────────────────────────────

    setCatalogueTheme(theme: DashboardTheme | 'all'): void {
        this.catalogueTheme.set(theme);
    }

    toggleMetric(id: string): void {
        const current = this.chosen();
        const next = current.includes(id)
            ? current.filter(metricId => metricId !== id)
            : [...current, id];
        this.updateChosen(next);
    }

    removeMetric(id: string): void {
        this.updateChosen(this.chosen().filter(metricId => metricId !== id));
    }

    goToCatalogue(theme?: DashboardTheme): void {
        if (theme) {
            this.catalogueTheme.set(theme);
        } else {
            this.catalogueTheme.set('all');
        }
        this.view.set('catalogue');
    }

    private updateChosen(ids: string[]): void {
        const sanitized = sanitizeMetrics(ids);
        this.chosen.set(sanitized);
        this.writeLocalStorage(sanitized);
        const idSalon = this.salon()?.id;
        if (idSalon) {
            this.salonService.saveDashboardMetrics(idSalon, sanitized).subscribe({error: () => undefined});
        }
    }

    private loadChosenMetrics(idSalon: string): void {
        // Cache localStorage pour un affichage instantané.
        const cached = this.readLocalStorage();
        if (cached) {
            this.chosen.set(cached);
        }
        // Source de vérité : choix partagé par salon.
        this.salonService.getDashboardMetrics(idSalon).subscribe({
            next: metrics => {
                const sanitized = sanitizeMetrics(metrics ?? []);
                this.chosen.set(sanitized);
                this.writeLocalStorage(sanitized);
            },
            error: () => undefined
        });
    }

    private readLocalStorage(): string[] | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? sanitizeMetrics(parsed) : null;
        } catch {
            return null;
        }
    }

    private writeLocalStorage(ids: string[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch {
            // Ignoré : le cache est facultatif.
        }
    }

    // ── Chargement des sources ──────────────────────────────────────────────

    private ensureSources(sources: Set<DashboardSource>): void {
        const idSalon = this.salon()?.id;
        if (!idSalon) {
            return;
        }
        for (const source of sources) {
            if (this.loadedSources.has(source) || this.loadingSources.has(source)) {
                continue;
            }
            this.loadingSources.add(source);
            this.loadSource(source, idSalon);
        }
    }

    private loadSource(source: DashboardSource, idSalon: string): void {
        const done = (): void => {
            this.loadingSources.delete(source);
            this.loadedSources.add(source);
        };
        switch (source) {
            case 'participations':
                this.participationService.query(idSalon).subscribe({
                    next: response => this.participations.set(response.body ?? []),
                    error: done,
                    complete: done
                });
                break;
            case 'stats':
                this.salonService.stats(idSalon, [Status.IN_VERIFICATION])
                    .subscribe({next: response => this.statsVerification.set(response.body)});
                this.salonService.stats(idSalon, [Status.ACCEPTED, Status.VALIDATED, Status.CLOSED])
                    .subscribe({next: response => this.statsConfirmed.set(response.body)});
                this.salonService.stats(idSalon, [Status.CANCELED, Status.REFUSED])
                    .subscribe({next: response => this.statsDiscarded.set(response.body), error: done, complete: done});
                break;
            case 'dashboard':
                this.salonService.dashboard(idSalon).subscribe({
                    next: result => this.dashboard.set(result),
                    error: done,
                    complete: done
                });
                break;
            case 'tasks':
                this.taskInstanceService.findAllBySalon(idSalon).subscribe({
                    next: tasks => this.tasks.set(tasks ?? []),
                    error: done,
                    complete: done
                });
                break;
            case 'volunteers':
                this.volunteerPlanningService.getPlanningVolunteers(idSalon).subscribe({
                    next: dto => {
                        if (dto) {
                            const planning = planningFromDto(dto);
                            this.volunteerDays.set(planning.days);
                            this.volunteerCategories.set(planning.categories);
                        }
                    },
                    error: done,
                    complete: done
                });
                break;
            case 'talks':
                this.salonService.getPlanningTalks(idSalon).subscribe({
                    next: dto => this.talks.set(dto?.talks ?? []),
                    error: done,
                    complete: done
                });
                break;
            case 'floorPlans':
                this.floorPlanService.load(idSalon).subscribe({
                    next: plans => this.floorPlans.set(plans ?? []),
                    error: done,
                    complete: done
                });
                break;
        }
    }

    private reload(): void {
        const idSalon = this.salon()?.id;
        if (!idSalon) {
            return;
        }
        const sources = [...this.loadedSources, ...this.loadingSources];
        this.loadedSources.clear();
        this.loadingSources.clear();
        this.ensureSources(new Set(sources));
    }

    // ── Import Google Forms (inchangé) ──────────────────────────────────────

    importFile(event: FileUploadHandlerEvent): void {
        const file = event.files[0];
        const idSalon = this.salon()?.id;
        if (!file || !idSalon) {
            return;
        }

        this.salonService.generate(idSalon, file).subscribe(participationsNew => {
            const detailMessage = participationsNew.map(part => {
                const therapistName = part.therapistName?.length > 10
                    ? part.therapistName.slice(0, 10) + '...'
                    : part.therapistName;
                return '<' + therapistName + '> inscrit le ' + (part.registrationDate
                    ? formatDate(part.registrationDate, 'dd.MM.yyyy HH:mm', this.locale)
                    : '-');
            });

            this.messageService.add({
                severity: 'info',
                summary: 'Résultat',
                detail: 'Nombre d\'inscriptions importées : ' + participationsNew.length + '\n\n' + detailMessage.join('\n'),
                closable: true,
                sticky: true
            });

            this.fileUploader.clear();
            this.reload();
        });
    }

    previousState(): void {
        window.history.back();
    }

    trackMetric(_index: number, def: MetricDef): string {
        return def.id;
    }

    trackId(_index: number, id: string): string {
        return id;
    }
}
