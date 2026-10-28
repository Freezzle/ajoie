import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {filter, switchMap, tap} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {FormatMediumDatePipe} from 'app/shared/date';
import {AlertErrorComponent} from 'app/shared/alert/alert-error.component';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {ContentPageComponent} from 'app/shared/components/content-page/content-page.component';
import {MenuBoxComponent} from 'app/shared/components/menu-box/menu-box.component';
import {
    applyChipFilters,
    buildStatusChipGroup,
    compareAlpha,
    compareDateDesc,
    EntityAction,
    EntityGroup,
    EntityListState,
    FilterChipGroup,
    GROUP_ALPHA_KEY,
    GROUP_STATUS_KEY,
    groupByAlphabet,
    groupByKey,
    matchesSearch,
    SORT_ALPHA_KEY,
    SORT_DATE_KEY,
    STATUS_COLLAPSED_BY_DEFAULT,
    STATUS_GROUP_ORDER,
    statusChipPredicates,
    statusColor
} from 'app/shared/components/entity-list';
import {EntityCountComponent} from 'app/shared/components/entity-list/entity-count.component';
import {EntityFootBadgeComponent} from 'app/shared/components/entity-list/entity-foot-badge.component';
import {EntityFootItemComponent} from 'app/shared/components/entity-list/entity-foot-item.component';
import {EntityHighlightComponent} from 'app/shared/components/entity-list/entity-highlight.component';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {EntityRowComponent} from 'app/shared/components/entity-list/entity-row.component';
import {EntityStatusComponent} from 'app/shared/components/entity-list/entity-status.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {NavigationStateService} from 'app/layouts/navbar/navigation-state.service';
import {copyToClipboard} from 'app/core/util/utils';
import {Status} from '../../enumerations/status.model';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';
import {getFormattedParticipationName, IParticipationList} from '../model/participation.interface';
import {hasDraftPredicate, toWatchPredicate} from '../model/participation-predicates';
import {ParticipationService} from '../service/participation.service';

/** Nombre de lignes affichées avant le bouton « Afficher plus ». */
const PAGE_SIZE = 150;

/** Pastille de facturation affichée dans le pied d'une ligne. */
interface InvoiceBadge {
    key: string;
    count: number;
    icon: string;
    labelKey: string;
    color: string;
}

@Component({
               selector: 'app-participation',
               imports: [
                   SharedModule,
                   FormatMediumDatePipe,
                   AlertErrorComponent,
                   ButtonBoxComponent,
                   ConfirmPopup,
                   ContentPageComponent,
                   MenuBoxComponent,
                   EntityCountComponent,
                   EntityFootBadgeComponent,
                   EntityFootItemComponent,
                   EntityHighlightComponent,
                   EntityListGroupComponent,
                   EntityListToolbarComponent,
                   EntityRowComponent,
                   EntityStatusComponent
               ],
               templateUrl: './participation.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ParticipationComponent implements OnInit {
    readonly participations = signal<IParticipationList[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly idSalon = signal<string | null>(null);
    readonly visibleLimit = signal<number>(PAGE_SIZE);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly participationService = inject(ParticipationService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly translateService = inject(TranslateService);
    private readonly navigationStateService = inject(NavigationStateService);

    readonly state = new EntityListState({
                                             defaultGroupBy: GROUP_STATUS_KEY,
                                             defaultSort: SORT_DATE_KEY,
                                             sortOptions: [
                                                 {
                                                     key: SORT_DATE_KEY,
                                                     labelKey: 'entityList.sort.date',
                                                     hintKey: 'entityList.sort.hint.registrationDate'
                                                 },
                                                 {
                                                     key: SORT_ALPHA_KEY,
                                                     labelKey: 'entityList.sort.alpha',
                                                     hintKey: 'entityList.sort.hint.therapistName'
                                                 }
                                             ],
                                             collapsedByDefault: groupBy => groupBy === GROUP_STATUS_KEY
                                                                            ? STATUS_COLLAPSED_BY_DEFAULT
                                                                            : []
                                         });

    readonly groupOptions = [
        {key: GROUP_STATUS_KEY, labelKey: 'entityList.group.status'},
        {key: GROUP_ALPHA_KEY, labelKey: 'entityList.group.alpha'}
    ];

    /**
     * Le salon est chargé de manière asynchrone par la navbar : on ne l'utilise que
     * lorsqu'il correspond réellement au salon de la route courante.
     */
    private readonly currentSalon = computed(() => {
        const idSalon = this.idSalon();
        const salon = this.navigationStateService.salon();

        return idSalon && salon?.id === idSalon ? salon : null;
    });

    private readonly predicates = computed<Record<string, (p: IParticipationList) => boolean>>(() => ({
        ...statusChipPredicates<IParticipationList>(participation => participation.status),
        alert: p => !!p.exhibitor?.redFlag || !!p.exhibitor?.duplicateDetected,
        expiredInvoice: p => this.nbExpired(p) > 0,
        toInvoice: p => this.isActive(p) && this.nbInvoices(p) === 0,
        hasDraft: p => hasDraftPredicate(p),
        toWatch: p => toWatchPredicate(p),
        crushOfHeart: p => !!p.crushOfHeart,
        guestOfHonor: p => !!p.guestOfHonor,
        arrangement: p => !!p.needArrangement,
        offer: p => !!p.hasOffer,
        comment: p => !!p.extraInformation
    }));

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.participations();
        const predicates = this.predicates();
        const count = (key: string): number => items.filter(predicates[key]).length;

        return [
            buildStatusChipGroup(items, participation => participation.status, 'participation.list.statusGroup'),
            {
                key: 'signals',
                labelKey: 'entityList.filterGroup.signals',
                mode: 'and',
                chips: [
                    {
                        key: 'alert',
                        labelKey: 'entityList.signal.alerts',
                        icon: 'triangle-exclamation',
                        color: 'var(--app-danger)',
                        count: count('alert')
                    },
                    {
                        key: 'expiredInvoice',
                        labelKey: 'entityList.signal.expiredInvoice',
                        icon: 'file-invoice',
                        color: 'var(--app-danger)',
                        count: count('expiredInvoice')
                    },
                    {
                        key: 'toInvoice',
                        labelKey: 'entityList.signal.toInvoice',
                        icon: 'file-invoice',
                        color: 'var(--app-status-verification)',
                        count: count('toInvoice')
                    },
                    {
                        key: 'hasDraft',
                        labelKey: 'entityList.signal.hasDraft',
                        icon: 'file-invoice',
                        color: 'var(--app-status-verification)',
                        count: count('hasDraft')
                    },
                    {
                        key: 'toWatch',
                        labelKey: 'entityList.signal.toWatch',
                        icon: 'triangle-exclamation',
                        color: 'var(--app-danger)',
                        count: count('toWatch')
                    },
                    {
                        key: 'comment',
                        labelKey: 'entityList.signal.comment',
                        icon: 'note-sticky',
                        color: 'var(--app-text)',
                        count: count('comment')
                    }
                ]
            }
        ];
    });

    readonly filtered = computed<IParticipationList[]>(() => {
        const query = this.state.query();
        const searched = this.participations().filter(p => matchesSearch([
                                                                             p.therapistName,
                                                                             getExhibitorFullName(p.exhibitor),
                                                                             p.exhibitor?.email,
                                                                             p.clientNumber
                                                                         ], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates());

        return [...filtered].sort(this.comparator());
    });

    readonly visible = computed(() => this.filtered().slice(0, this.visibleLimit()));

    readonly hasMore = computed(() => this.filtered().length > this.visibleLimit());

    readonly groups = computed<EntityGroup<IParticipationList>[]>(() => {
        const items = this.visible();

        if (this.state.groupBy() === GROUP_ALPHA_KEY) {
            return groupByAlphabet(items, participation => participation.therapistName);
        }

        return groupByKey(items,
                          STATUS_GROUP_ORDER,
                          participation => participation.status,
                          key => `participation.list.statusGroup.${key}`,
                          key => statusColor(key as Status));
    });

    readonly subtitle = computed(() => this.currentSalon()?.place ?? '');

    /** « J-x » avant l'ouverture du salon, vide si le salon a commencé. */
    readonly daysBeforeOpening = computed(() => {
        const startingDate = this.currentSalon()?.startingDate;
        if (!startingDate) {
            return '';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(startingDate);
        start.setHours(0, 0, 0, 0);

        const days = Math.round((start.getTime() - today.getTime()) / 86400000);

        return days > 0 ? `J-${days}` : '';
    });

    readonly countLabel = computed(() => {
        const count = this.participations().length;
        const key = count > 1 ? 'participation.list.countPlural' : 'participation.list.countSingular';

        return `${count} ${this.translateService.instant(key) as string}`;
    });

    readonly pageMenuItems = computed<MenuItem[]>(() => [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.load()
        },
        {
            label: this.translateService.instant('participation.copyActiveExhibitorEmails') as string,
            icon: 'pi pi-copy',
            command: () => this.clipboardActiveExhibitorEmails()
        }
    ]);

    constructor() {
        this.state.connectQueryParams(this.activatedRoute, this.router);
    }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            const idSalon = params.get('idSalon');
            if (this.idSalon() === idSalon) {
                return;
            }

            this.idSalon.set(idSalon);
            this.participations.set([]);

            this.load();
        });
    }

    load(): void {
        const idSalon = this.idSalon();
        if (!idSalon) {
            return;
        }

        this.isLoading.set(true);

        this.participationService
            .query(idSalon)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(result => {
                // le salon a pu changer pendant la requête : on ignore une réponse obsolète
                if (this.idSalon() !== idSalon) {
                    return;
                }

                this.participations.set(result.body ?? []);
            });
    }

    delete(target: HTMLElement, participation: IParticipationList): void {
        this.confirmDialogService.delete(target, 'participation.delete.question', {
            fullName: getFormattedParticipationName(participation)
        }).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.participationService.delete(participation.id)),
            tap(() => this.load())
        ).subscribe();
    }

    clipboardActiveExhibitorEmails(): void {
        this.isLoading.set(true);

        this.participationService.getExhibitorEmailsWithActiveParticipations()
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(emails => copyToClipboard(emails.join(',')));
    }

    actionsFor(participation: IParticipationList): EntityAction[] {
        return this.rowActions().get(participation.id) ?? [];
    }

    /**
     * Les actions sont calculées une fois par jeu de données : un tableau recréé à
     * chaque détection de changement reconstruirait le menu sous le curseur, ce qui
     * obligerait à cliquer deux fois.
     */
    private readonly rowActions = computed(() => new Map<string, EntityAction[]>(
        this.visible().map(participation => [participation.id, this.buildActions(participation)])));

    private buildActions(participation: IParticipationList): EntityAction[] {
        const idExhibitor = participation.exhibitor?.id;

        return [
            {
                labelKey: 'entityList.action.detail',
                icon: 'pi pi-eye',
                routerLink: ['./', participation.id, 'view']
            },
            {
                labelKey: 'entityList.action.client',
                icon: 'pi pi-user',
                routerLink: idExhibitor ? ['/admin', 'exhibitors', idExhibitor, 'view'] : undefined,
                hidden: !idExhibitor
            },
            {
                labelKey: 'entityList.action.billing',
                icon: 'pi pi-euro',
                routerLink: ['./', participation.id, 'invoicing-plans']
            },
            {
                labelKey: 'entityList.action.delete',
                icon: 'pi pi-trash',
                danger: true,
                separatorBefore: true,
                run: target => this.delete(target, participation)
            }
        ];
    }

    /** Résumé de groupe : « x échues · p/t payées », ou « pas de facture ». */
    groupSummary(group: EntityGroup<IParticipationList>): string {
        const total = group.items.reduce((sum, p) => sum + this.nbInvoices(p), 0);

        if (total === 0) {
            return this.translateService.instant('participation.list.summary.noInvoice') as string;
        }

        const paid = group.items.reduce((sum, p) => sum + p.nbPaid, 0);
        const expired = group.items.reduce((sum, p) => sum + this.nbExpired(p), 0);
        const paidLabel = this.translateService.instant('participation.list.summary.paid') as string;
        const summary = `${paid}/${total} ${paidLabel}`;

        if (expired === 0) {
            return summary;
        }

        const expiredLabel = this.translateService.instant(expired > 1
                                                           ? 'participation.list.summary.expiredPlural'
                                                           : 'participation.list.summary.expiredSingular') as string;

        return `${expired} ${expiredLabel} · ${summary}`;
    }

    nbInvoices(participation: IParticipationList): number {
        return participation.nbDraft + participation.nbIssued + participation.nbPaid;
    }

    nbExpired(participation: IParticipationList): number {
        return participation.nbExpired;
    }

    /** Pastilles de facturation non nulles, dans l'ordre du cycle de vie d'une facture. */
    invoiceBadges(participation: IParticipationList): InvoiceBadge[] {
        return [
            {
                key: 'draft',
                count: participation.nbDraft,
                icon: 'sheet-plastic',
                labelKey: 'invoicingPlan.drafts',
                color: 'var(--app-status-closed)'
            },
            {
                key: 'issued',
                count: participation.nbIssued,
                icon: 'file-import',
                labelKey: 'invoicingPlan.waitingPayments',
                color: 'var(--app-status-accepted)'
            },
            {
                key: 'paid',
                count: participation.nbPaid,
                icon: 'file-circle-check',
                labelKey: 'invoicingPlan.paids',
                color: 'var(--app-status-validated)'
            },
            {
                key: 'expired',
                count: participation.nbExpired,
                icon: 'clock',
                labelKey: 'invoicingPlan.expirations',
                color: 'var(--app-danger)'
            }
        ].filter(badge => badge.count > 0);
    }

    /** Une participation active sans facture est « à facturer ». */
    isActive(participation: IParticipationList): boolean {
        return participation.status === Status.ACCEPTED || participation.status === Status.VALIDATED;
    }

    showToInvoice(participation: IParticipationList): boolean {
        return this.nbInvoices(participation) === 0 && participation.nbExpired === 0 && this.isActive(participation);
    }

    /** « (partagé) » ou « (dont partagé) » à côté du nombre de stands. */
    sharedStandDetail(participation: IParticipationList): string | null {
        if (participation.nbSharedStands === 0) {
            return null;
        }

        return this.translateService.instant(participation.nbStands > 1
                                             ? 'participation.list.foot.withSharedStand'
                                             : 'participation.list.foot.sharedStand') as string;
    }

    statusLabelKey(status: Status): string {
        return `participation.list.status.${status}`;
    }

    exhibitorName(participation: IParticipationList): string {
        return getExhibitorFullName(participation.exhibitor);
    }

    isCollapsed(group: EntityGroup<IParticipationList>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<IParticipationList>, collapsed: boolean): void {
        this.state.setCollapsed(group.key, collapsed);
    }

    showMore(): void {
        this.visibleLimit.update(limit => limit + PAGE_SIZE);
    }

    create(): void {
        void this.router.navigate(['./new'], {relativeTo: this.activatedRoute});
    }

    previousState(): void {
        window.history.back();
    }

    private comparator(): (a: IParticipationList, b: IParticipationList) => number {
        if (this.state.sort() === SORT_ALPHA_KEY) {
            return (a, b) => compareAlpha(a.therapistName, b.therapistName) ||
                             compareDateDesc(a.registrationDate, b.registrationDate);
        }

        return (a, b) => compareDateDesc(a.registrationDate, b.registrationDate);
    }

    protected readonly Status = Status;
    protected readonly statusColor = statusColor;
}
