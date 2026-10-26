import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {ConfirmPopup} from 'primeng/confirmpopup';
import dayjs from 'dayjs/esm';
import {filter, switchMap, tap} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {AlertErrorComponent} from 'app/shared/alert/alert-error.component';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {ContentPageComponent} from 'app/shared/components/content-page/content-page.component';
import {MenuBoxComponent} from 'app/shared/components/menu-box/menu-box.component';
import {
    applyChipFilters,
    compareAlpha,
    EntityAction,
    EntityGroup,
    EntityListState,
    FilterChipGroup,
    GROUP_STATUS_KEY,
    groupByKey,
    matchesSearch,
    SORT_ALPHA_KEY
} from 'app/shared/components/entity-list';
import {EntityCountComponent} from 'app/shared/components/entity-list/entity-count.component';
import {EntityFootItemComponent} from 'app/shared/components/entity-list/entity-foot-item.component';
import {EntityHighlightComponent} from 'app/shared/components/entity-list/entity-highlight.component';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {EntityRowComponent} from 'app/shared/components/entity-list/entity-row.component';
import {EntityStatusComponent} from 'app/shared/components/entity-list/entity-status.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {EventModalComponent} from 'app/shared/event-modal/event-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NavigationStateService} from 'app/layouts/navbar/navigation-state.service';
import {InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';
import {State} from '../../enumerations/state.model';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';
import {ParticipationService} from '../../participation/service/participation.service';
import {IInvoicingPlanList} from '../model/invoicing-plan.interface';
import {InvoicingPlanActionsService} from '../service/invoicing-plan-actions.service';
import {InvoicingPlanBucket, InvoicingPlanHelperService} from '../service/invoicing-plan-helper.service';
import {InvoicingPlanService} from '../service/invoicing-plan.service';
import {InvoicingPlanDetailComponent} from '../detail/invoicing-plan-detail.component';

/** Nombre de lignes affichées avant le bouton « Afficher plus ». */
const PAGE_SIZE = 150;

const GROUP_PARTICIPATION_KEY = 'participation';
const GROUP_DUE_KEY = 'due';
const SORT_URGENCY_KEY = 'urgency';
const SORT_NUMBER_KEY = 'number';
const SORT_BALANCE_KEY = 'balance';

/** Ordre des groupes « Statut » : le travail en retard d'abord. */
const BUCKET_ORDER: InvoicingPlanBucket[] = ['late', 'todo', 'wait', 'PAID', 'CANCELLED'];

/** Ordre des groupes « Échéance ». */
const DUE_ORDER = ['late', 'week', 'later', 'nodate', 'closed'];

@Component({
               selector: 'app-invoicing-plan-list',
               imports: [
                   SharedModule,
                   RouterLink,
                   AlertErrorComponent,
                   ButtonBoxComponent,
                   ConfirmPopup,
                   ContentPageComponent,
                   MenuBoxComponent,
                   EntityCountComponent,
                   EntityFootItemComponent,
                   EntityHighlightComponent,
                   EntityListGroupComponent,
                   EntityListToolbarComponent,
                   EntityRowComponent,
                   EntityStatusComponent,
                   InvoicingPlanDetailComponent
               ],
               templateUrl: './invoicing-plan-list.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class InvoicingPlanListComponent implements OnInit {
    readonly invoicingPlans = signal<IInvoicingPlanList[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly idSalon = signal<string | null>(null);
    readonly idParticipation = signal<string | null>(null);
    readonly visibleLimit = signal<number>(PAGE_SIZE);
    /** Identifiant du plan déplié ; une seule ligne ouverte à la fois. */
    readonly expandedPlanId = signal<string | null>(null);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly invoicingPlanService = inject(InvoicingPlanService);
    private readonly participationService = inject(ParticipationService);
    private readonly actionsService = inject(InvoicingPlanActionsService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly modalService = inject(NgbModal);
    private readonly translateService = inject(TranslateService);
    private readonly navigationStateService = inject(NavigationStateService);

    protected readonly helper = inject(InvoicingPlanHelperService);

    readonly state = new EntityListState({
                                             defaultGroupBy: GROUP_PARTICIPATION_KEY,
                                             defaultSort: SORT_URGENCY_KEY,
                                             sortOptions: [
                                                 {
                                                     key: SORT_URGENCY_KEY,
                                                     labelKey: 'invoicingPlan.list.sort.urgency',
                                                     hintKey: 'invoicingPlan.list.sort.hint.urgency'
                                                 },
                                                 {
                                                     key: SORT_NUMBER_KEY,
                                                     labelKey: 'invoicingPlan.list.sort.number'
                                                 },
                                                 {
                                                     key: SORT_ALPHA_KEY,
                                                     labelKey: 'entityList.sort.alpha',
                                                     hintKey: 'invoicingPlan.list.sort.hint.exhibitor'
                                                 },
                                                 {
                                                     key: SORT_BALANCE_KEY,
                                                     labelKey: 'invoicingPlan.list.sort.balance'
                                                 }
                                             ],
                                             collapsedByDefault: groupBy => groupBy === GROUP_STATUS_KEY
                                                                            ? ['PAID', 'CANCELLED']
                                                                            : []
                                         });

    /** Filtrée sur une participation, l'option « Participation » n'a plus de sens. */
    readonly groupOptions = computed(() => [
        ...(this.idParticipation() ? [] : [{
            key: GROUP_PARTICIPATION_KEY,
            labelKey: 'invoicingPlan.list.group.participation'
        }]),
        {key: GROUP_STATUS_KEY, labelKey: 'entityList.group.status'},
        {key: GROUP_DUE_KEY, labelKey: 'invoicingPlan.list.group.due'}
    ]);

    private readonly predicates = computed<Record<string, (plan: IInvoicingPlanList) => boolean>>(() => ({
        todo: plan => this.helper.bucket(plan) === 'todo',
        wait: plan => this.helper.bucket(plan) === 'wait',
        late: plan => this.helper.bucket(plan) === 'late',
        PAID: plan => this.helper.bucket(plan) === 'PAID',
        CANCELLED: plan => this.helper.bucket(plan) === 'CANCELLED',
        postal: plan => plan.invoiceSendingMethod === InvoiceSendingMethod.POSTAL,
        arrangement: plan => !!plan.needArrangement,
        reminded: plan => plan.state === State.ISSUED && this.nbReminders(plan) > 0,
        customPrice: plan => !!plan.hasCustomPrice
    }));

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.invoicingPlans();
        const predicates = this.predicates();
        const count = (key: string): number => items.filter(predicates[key]).length;

        return [
            {
                key: 'status',
                labelKey: 'entityList.filterGroup.status',
                mode: 'or',
                chips: BUCKET_ORDER.map(bucket => ({
                    key: bucket,
                    labelKey: `invoicingPlan.list.chip.${bucket}`,
                    dotColor: this.bucketColor(bucket),
                    count: count(bucket),
                    alwaysVisible: true
                }))
            },
            {
                key: 'signals',
                labelKey: 'entityList.filterGroup.signals',
                mode: 'and',
                chips: [
                    {
                        key: 'postal',
                        labelKey: 'invoicingPlan.list.chip.postal',
                        icon: 'envelope',
                        color: 'var(--app-text)',
                        count: count('postal')
                    },
                    {
                        key: 'arrangement',
                        labelKey: 'entityList.signal.arrangement',
                        icon: 'handshake-simple',
                        color: 'var(--app-primary)',
                        count: count('arrangement')
                    },
                    {
                        key: 'reminded',
                        labelKey: 'invoicingPlan.list.chip.reminded',
                        icon: 'bell',
                        color: 'var(--app-warn)',
                        count: count('reminded')
                    },
                    {
                        key: 'customPrice',
                        labelKey: 'invoicingPlan.list.chip.customPrice',
                        icon: 'tag',
                        color: 'var(--app-warn)',
                        count: count('customPrice')
                    }
                ]
            }
        ];
    });

    readonly filtered = computed<IInvoicingPlanList[]>(() => {
        const query = this.state.query();
        const searched = this.invoicingPlans().filter(plan => matchesSearch([
                                                                                plan.billingNumber,
                                                                                this.exhibitorName(plan),
                                                                                plan.participation?.therapistName
                                                                            ], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates());

        return [...filtered].sort(this.comparator());
    });

    readonly visible = computed(() => this.filtered().slice(0, this.visibleLimit()));

    readonly hasMore = computed(() => this.filtered().length > this.visibleLimit());

    /** Groupement effectif : « Participation » est impossible quand on filtre dessus. */
    readonly effectiveGroupBy = computed(() => {
        const groupBy = this.state.groupBy();

        return this.idParticipation() && groupBy === GROUP_PARTICIPATION_KEY ? GROUP_STATUS_KEY : groupBy;
    });

    readonly groups = computed<EntityGroup<IInvoicingPlanList>[]>(() => {
        const items = this.visible();

        switch (this.effectiveGroupBy()) {
            case GROUP_STATUS_KEY:
                return groupByKey(items,
                                  BUCKET_ORDER,
                                  plan => this.helper.bucket(plan),
                                  key => `invoicingPlan.list.statusGroup.${key}`,
                                  key => this.bucketColor(key as InvoicingPlanBucket));
            case GROUP_DUE_KEY:
                return groupByKey(items,
                                  DUE_ORDER,
                                  plan => this.dueBucket(plan),
                                  key => `invoicingPlan.list.dueGroup.${key}`,
                                  key => this.dueColor(key));
            default:
                return this.groupByParticipation(items);
        }
    });

    readonly subtitle = computed(() => {
        if (this.idParticipation()) {
            return '';
        }

        const salon = this.navigationStateService.salon();
        const idSalon = this.idSalon();

        return !salon || (idSalon && salon.id !== idSalon) ? '' : salon.place;
    });

    /**
     * Libellé du filtre « participation » affiché sous le titre, `null` hors de ce mode.
     *
     * Le nom est déduit des factures chargées : une participation sans facture — justement le
     * cas où l'on vient régénérer — n'en a aucune, d'où le libellé de repli.
     */
    readonly participationContext = computed(() => {
        if (!this.idParticipation()) {
            return null;
        }

        const name = this.participationName();

        return name
               ? this.translateService.instant('entityList.context.participation', {name}) as string
               : this.translateService.instant('invoicingPlan.list.context.participationUnknown') as string;
    });

    /** Lien vers la liste complète du salon, utilisé pour retirer le filtre « participation ». */
    readonly allInvoicesLink = computed(() => {
        const idSalon = this.idSalon();

        return idSalon ? ['/admin', 'salons', idSalon, 'invoicing-plans'] : [];
    });

    readonly pageMenuItems = computed<MenuItem[]>(() => [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.load()
        }
    ]);

    constructor() {
        this.state.connectQueryParams(this.activatedRoute, this.router);
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.idSalon.set(params.get('idSalon'));
            this.idParticipation.set(params.get('idParticipation'));

            this.load();
        });
    }

    load(): void {
        const idSalon = this.idSalon();
        if (!idSalon) {
            return;
        }

        this.isLoading.set(true);
        this.actionsService.clear();

        this.invoicingPlanService
            .queryBySalon(idSalon)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(plans => {
                // le salon a pu changer pendant la requête : on ignore une réponse obsolète
                if (this.idSalon() !== idSalon) {
                    return;
                }

                const idParticipation = this.idParticipation();

                this.invoicingPlans.set(idParticipation
                                        ? plans.filter(plan => plan.participation?.id === idParticipation)
                                        : plans);
            });
    }

    /** Recharge la liste après une action, en gardant la ligne dépliée ouverte. */
    reloadAfterAction(): void {
        const expanded = this.expandedPlanId();

        this.load();
        this.expandedPlanId.set(expanded);
    }

    regenerate(target: HTMLElement): void {
        const idParticipation = this.idParticipation();
        if (!idParticipation) {
            return;
        }

        this.confirmDialogService.confirmAction(target, 'invoicingPlan.list.action.regenerateQuestion', {})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.participationService.generateInvoices(idParticipation)),
                tap(() => this.load())
            ).subscribe();
    }

    showMore(): void {
        this.visibleLimit.update(limit => limit + PAGE_SIZE);
    }

    isExpanded(plan: IInvoicingPlanList): boolean {
        return this.expandedPlanId() === plan.id;
    }

    setExpanded(plan: IInvoicingPlanList, expanded: boolean): void {
        this.expandedPlanId.set(expanded ? plan.id : null);

        if (expanded) {
            this.actionsService.ensureLoaded(plan.id);
        }
    }

    /** Les actions serveur ne sont chargées qu'à la première ouverture du rouage. */
    onMenuOpened(plan: IInvoicingPlanList): void {
        this.actionsService.ensureLoaded(plan.id);
    }

    actionsFor(plan: IInvoicingPlanList): EntityAction[] {
        return this.rowActions().get(plan.id) ?? [];
    }

    /**
     * Les actions sont calculées une fois par jeu de données : un tableau recréé à
     * chaque détection de changement reconstruirait le menu sous le curseur, ce qui
     * obligerait à cliquer deux fois.
     */
    private readonly rowActions = computed(() => new Map<string, EntityAction[]>(
        this.visible().map(plan => [plan.id, this.buildActions(plan)])));

    private buildActions(plan: IInvoicingPlanList): EntityAction[] {
        const idSalon = this.idSalon();
        const idParticipation = plan.participation?.id;
        const idExhibitor = plan.participation?.exhibitor?.id;
        const serverActions = this.actionsService.actionsOf(plan.id);

        const dynamic: EntityAction[] = serverActions
                                        ? serverActions.map(action => ({
                labelKey: action.labelKey,
                icon: iconForActionType(action.type),
                disabled: action.disabled,
                helpText: action.helpKey ? this.translateService.instant(action.helpKey) as string : undefined,
                conditionalKeys: action.conditionalKeys ?? [],
                run: target => this.actionsService.run(action, plan.id, target)
                                   .subscribe(() => this.reloadAfterAction())
            }))
                                        : [{labelKey: 'entityList.loading', icon: 'pi pi-spin pi-spinner', disabled: true}];

        return [
            ...dynamic,
            {
                labelKey: 'invoicingPlan.list.action.onlyThisParticipation',
                icon: 'pi pi-filter',
                separatorBefore: true,
                routerLink: idSalon && idParticipation
                            ? ['/admin', 'salons', idSalon, 'participations', idParticipation, 'invoicing-plans']
                            : undefined,
                hidden: !idSalon || !idParticipation || !!this.idParticipation()
            },
            {
                labelKey: 'entityList.action.participation',
                icon: 'pi pi-list',
                routerLink: idSalon && idParticipation
                            ? ['/admin', 'salons', idSalon, 'participations', idParticipation, 'view']
                            : undefined,
                hidden: !idSalon || !idParticipation
            },
            {
                labelKey: 'entityList.action.client',
                icon: 'pi pi-user',
                routerLink: idExhibitor ? ['/admin', 'exhibitors', idExhibitor, 'view'] : undefined,
                hidden: !idExhibitor
            },
            {
                labelKey: 'event.buttonTitle',
                icon: 'pi pi-history',
                run: () => this.openHistory(plan)
            }
        ];
    }

    private openHistory(plan: IInvoicingPlanList): void {
        this.invoicingPlanService.getEventLogs(plan.id).subscribe(events => {
            const modalRef = this.modalService.open(EventModalComponent, {size: 'lg'});
            modalRef.componentInstance.events = events.body ?? [];
        });
    }

    // ── Affichage d'une ligne ────────────────────────────────────────────────

    exhibitorName(plan: IInvoicingPlanList): string {
        return getExhibitorFullName(plan.participation?.exhibitor) || (plan.participation?.therapistName ?? '');
    }

    groupedByParticipation(): boolean {
        return this.effectiveGroupBy() === GROUP_PARTICIPATION_KEY;
    }

    stateColor(plan: IInvoicingPlanList): string {
        return this.helper.stateColor(plan);
    }

    stateLabelKey(plan: IInvoicingPlanList): string {
        return this.helper.stateLabelKey(plan);
    }

    isCancelled(plan: IInvoicingPlanList): boolean {
        return plan.state === State.CANCELLED;
    }

    nbReminders(plan: IInvoicingPlanList): number {
        return plan.reminderDates?.length ?? 0;
    }

    isPostal(plan: IInvoicingPlanList): boolean {
        return plan.invoiceSendingMethod === InvoiceSendingMethod.POSTAL;
    }

    /** Une seule date courte sous le titre, selon l'état. */
    metaText(plan: IInvoicingPlanList): string {
        switch (plan.state) {
            case State.IS_ISSUING:
                return this.translateService.instant('invoicingPlan.list.meta.issuing') as string;
            case State.ISSUED:
                return this.translateService.instant('invoicingPlan.list.meta.due',
                                                     {date: shortDate(plan.expirationDate)}) as string;
            case State.PAID:
                return this.translateService.instant('invoicingPlan.list.meta.paid',
                                                     {date: shortDate(plan.lastPaymentDate)}) as string;
            case State.CANCELLED:
                return this.translateService.instant('invoicingPlan.list.meta.cancelled',
                                                     {date: shortDate(plan.generationDate)}) as string;
            default:
                return this.translateService.instant('invoicingPlan.list.meta.created',
                                                     {date: shortDate(plan.generationDate)}) as string;
        }
    }

    metaColor(plan: IInvoicingPlanList): string {
        switch (this.helper.bucket(plan)) {
            case 'late':
                return 'var(--app-danger)';
            case 'wait':
                return this.helper.urgency(plan) <= 7 ? 'var(--app-warn)' : 'var(--app-text)';
            case 'PAID':
                return 'var(--app-status-validated)';
            case 'CANCELLED':
                return 'var(--app-text-muted)';
            default:
                return plan.state === State.IS_ISSUING ? 'var(--app-status-accepted)' : 'var(--app-text-muted)';
        }
    }

    /** Côté droit : le solde seul, formulé selon l'état. */
    sideLabel(plan: IInvoicingPlanList): string {
        const key = this.helper.isDraft(plan.state) || plan.state === State.IS_ISSUING
                    ? 'toInvoice'
                    : plan.state === State.PAID
                      ? ((plan.balance ?? 0) < 0 ? 'overpaid' : 'paid')
                      : 'left';

        return this.translateService.instant(`invoicingPlan.list.side.${key}`) as string;
    }

    sideAmount(plan: IInvoicingPlanList): number {
        if (this.helper.isDraft(plan.state) || plan.state === State.IS_ISSUING) {
            return plan.totalAmount ?? 0;
        }

        if (plan.state === State.PAID) {
            const balance = plan.balance ?? 0;

            return balance < 0 ? Math.abs(balance) : plan.paidAmount ?? 0;
        }

        return plan.balance ?? 0;
    }

    sideColor(plan: IInvoicingPlanList): string {
        switch (this.helper.bucket(plan)) {
            case 'late':
                return 'var(--app-danger)';
            case 'PAID':
                return (plan.balance ?? 0) < 0 ? 'var(--app-warn)' : 'var(--app-status-validated)';
            case 'CANCELLED':
                return 'var(--app-text-muted)';
            default:
                return 'var(--app-text)';
        }
    }

    // ── Groupes ──────────────────────────────────────────────────────────────

    /**
     * Un groupe par participation. L'ordre dépend des montants et de l'urgence,
     * `groupByKey` ne convient donc pas.
     */
    private groupByParticipation(items: IInvoicingPlanList[]): EntityGroup<IInvoicingPlanList>[] {
        const buckets = new Map<string, IInvoicingPlanList[]>();

        items.forEach(plan => {
            const key = plan.participation?.id ?? 'none';
            const bucket = buckets.get(key);
            if (bucket) {
                bucket.push(plan);
            } else {
                buckets.set(key, [plan]);
            }
        });

        const alphabetical = this.state.sort() === SORT_ALPHA_KEY;

        return [...buckets.entries()]
            .map(([key, plans]) => ({
                key,
                label: this.exhibitorName(plans[0]),
                rawLabel: true,
                color: this.participationColor(plans),
                items: plans,
                ratio: this.paidRatio(plans),
                summary: this.participationSummary(plans)
            }))
            .sort((a, b) => alphabetical
                            ? compareAlpha(a.label, b.label)
                            : this.minUrgency(a.items) - this.minUrgency(b.items));
    }

    private minUrgency(plans: IInvoicingPlanList[]): number {
        return Math.min(...plans.map(plan => this.helper.urgency(plan)));
    }

    private participationColor(plans: IInvoicingPlanList[]): string {
        if (plans.some(plan => this.helper.bucket(plan) === 'late')) {
            return 'var(--app-status-refused)';
        }

        if (plans.some(plan => plan.state === State.ISSUED && (plan.balance ?? 0) > 0)) {
            return 'var(--app-status-accepted)';
        }

        if (plans.every(plan => this.helper.isDraft(plan.state))) {
            return 'var(--app-text-muted)';
        }

        return 'var(--app-status-validated)';
    }

    /** Part payée d'une participation, brouillons compris dans le total. */
    private paidRatio(plans: IInvoicingPlanList[]): number {
        const billed = this.billedTotal(plans) + this.draftTotal(plans);

        return billed > 0 ? Math.min(1, this.paidTotal(plans) / billed) : 0;
    }

    private participationSummary(plans: IInvoicingPlanList[]): string {
        const parts: string[] = [
            `${this.translateService.instant('invoicingPlan.list.summary.billed') as string} ${money(this.billedTotal(plans))}`,
            `${this.translateService.instant('invoicingPlan.list.summary.paid') as string} ${money(this.paidTotal(plans))}`,
            `${this.translateService.instant('invoicingPlan.list.summary.left') as string} ${money(this.leftTotal(plans))}`
        ];

        const draft = this.draftTotal(plans);
        if (draft > 0) {
            parts.push(`${this.translateService.instant('invoicingPlan.list.summary.draft') as string} ${money(draft)}`);
        }

        return parts.join(' · ');
    }

    /** Facturé : hors brouillons et hors annulés. */
    private billedTotal(plans: IInvoicingPlanList[]): number {
        return plans.filter(plan => !this.helper.isDraft(plan.state) && plan.state !== State.CANCELLED)
                    .reduce((sum, plan) => sum + (plan.totalAmount ?? 0), 0);
    }

    private draftTotal(plans: IInvoicingPlanList[]): number {
        return plans.filter(plan => this.helper.isDraft(plan.state))
                    .reduce((sum, plan) => sum + (plan.totalAmount ?? 0), 0);
    }

    private paidTotal(plans: IInvoicingPlanList[]): number {
        return plans.filter(plan => plan.state !== State.CANCELLED)
                    .reduce((sum, plan) => sum + (plan.paidAmount ?? 0), 0);
    }

    private leftTotal(plans: IInvoicingPlanList[]): number {
        return plans.filter(plan => plan.state === State.ISSUED)
                    .reduce((sum, plan) => sum + Math.max(0, plan.balance ?? 0), 0);
    }

    groupSummary(group: EntityGroup<IInvoicingPlanList>): string {
        if (group.summary) {
            return group.summary;
        }

        if (this.effectiveGroupBy() === GROUP_STATUS_KEY) {
            switch (group.key) {
                case 'todo':
                    return `${this.translateService.instant('invoicingPlan.list.summary.toInvoice') as string} ${money(this.draftTotal(group.items))}`;
                case 'PAID':
                    return `${this.translateService.instant('invoicingPlan.list.summary.cashed') as string} ${money(this.paidTotal(group.items))}`;
                case 'CANCELLED':
                    return '';
                default:
                    return `${this.translateService.instant('invoicingPlan.list.summary.left') as string} ${money(this.leftTotal(group.items))}`;
            }
        }

        if (group.key === 'closed' || group.key === 'nodate') {
            return '';
        }

        return `${this.translateService.instant('invoicingPlan.list.summary.left') as string} ${money(this.leftTotal(group.items))}`;
    }

    isCollapsed(group: EntityGroup<IInvoicingPlanList>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<IInvoicingPlanList>, collapsed: boolean): void {
        this.state.setCollapsed(group.key, collapsed);
    }

    previousState(): void {
        window.history.back();
    }

    private participationName(): string {
        const first = this.invoicingPlans()[0];

        return first ? this.exhibitorName(first) : '';
    }

    private dueBucket(plan: IInvoicingPlanList): string {
        const bucket = this.helper.bucket(plan);

        if (bucket === 'late') {
            return 'late';
        }
        if (bucket === 'PAID' || bucket === 'CANCELLED') {
            return 'closed';
        }
        if (bucket === 'todo') {
            return 'nodate';
        }

        return this.helper.urgency(plan) <= 7 ? 'week' : 'later';
    }

    private dueColor(key: string): string {
        switch (key) {
            case 'late':
                return 'var(--app-status-refused)';
            case 'week':
                return 'var(--app-warn)';
            case 'later':
                return 'var(--app-status-accepted)';
            case 'closed':
                return 'var(--app-status-validated)';
            default:
                return 'var(--app-text-muted)';
        }
    }

    private bucketColor(bucket: InvoicingPlanBucket): string {
        switch (bucket) {
            case 'late':
                return 'var(--app-status-refused)';
            case 'wait':
                return 'var(--app-status-accepted)';
            case 'PAID':
                return 'var(--app-status-validated)';
            case 'CANCELLED':
                return 'var(--app-status-canceled)';
            default:
                return 'var(--app-text-muted)';
        }
    }

    private comparator(): (a: IInvoicingPlanList, b: IInvoicingPlanList) => number {
        switch (this.state.sort()) {
            case SORT_NUMBER_KEY:
                return (a, b) => compareAlpha(b.billingNumber, a.billingNumber);
            case SORT_ALPHA_KEY:
                return (a, b) => compareAlpha(this.exhibitorName(a), this.exhibitorName(b))
                                 || compareAlpha(a.billingNumber, b.billingNumber);
            case SORT_BALANCE_KEY:
                return (a, b) => (b.balance ?? 0) - (a.balance ?? 0);
            default:
                return (a, b) => this.helper.urgency(a) - this.helper.urgency(b);
        }
    }
}

/** Date courte `dd.MM` : l'année est implicite dans une liste de factures. */
function shortDate(date: dayjs.Dayjs | null | undefined): string {
    return date ? dayjs(date).format('DD.MM') : '—';
}

function money(amount: number): string {
    return amount.toFixed(2);
}

function iconForActionType(type: string): string {
    switch (type) {
        case 'EMAIL':
            return 'pi pi-envelope';
        case 'DOWNLOAD':
            return 'pi pi-file-pdf';
        default:
            return 'pi pi-bolt';
    }
}
