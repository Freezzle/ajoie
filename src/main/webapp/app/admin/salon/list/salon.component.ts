import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {ConfirmPopup} from 'primeng/confirmpopup';
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
    SORT_DATE_KEY,
    SORT_TITLE_KEY
} from 'app/shared/components/entity-list';
import {EntityCountComponent} from 'app/shared/components/entity-list/entity-count.component';
import {EntityFootItemComponent} from 'app/shared/components/entity-list/entity-foot-item.component';
import {EntityHighlightComponent} from 'app/shared/components/entity-list/entity-highlight.component';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {EntityRowComponent} from 'app/shared/components/entity-list/entity-row.component';
import {EntityStatusComponent} from 'app/shared/components/entity-list/entity-status.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {ISalon} from '../model/salon.interface';
import {SalonService} from '../service/salon.service';
import {
    daysBeforeOpening,
    SALON_STATE_ORDER,
    SalonState,
    salonPeriod,
    salonState,
    salonStateColor
} from './salon.list.utils';

/** Nombre de lignes affichées avant le bouton « Afficher plus ». */
const PAGE_SIZE = 150;

@Component({
               selector: 'app-salon',
               imports: [
                   SharedModule,
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
                   EntityStatusComponent
               ],
               templateUrl: './salon.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class SalonComponent implements OnInit {
    readonly salons = signal<ISalon[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly visibleLimit = signal<number>(PAGE_SIZE);

    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly salonService = inject(SalonService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly translateService = inject(TranslateService);

    readonly state = new EntityListState({
                                             defaultGroupBy: GROUP_STATUS_KEY,
                                             defaultSort: SORT_DATE_KEY,
                                             alphaIsTitle: true,
                                             sortOptions: [
                                                 {
                                                     key: SORT_DATE_KEY,
                                                     labelKey: 'entityList.sort.date',
                                                     hintKey: 'entityList.sort.hint.startingDate'
                                                 },
                                                 {
                                                     key: SORT_TITLE_KEY,
                                                     labelKey: 'entityList.sort.title',
                                                     hintKey: 'entityList.sort.hint.place'
                                                 }
                                             ],
                                             collapsedByDefault: groupBy => groupBy === GROUP_STATUS_KEY
                                                                            ? [SalonState.ARCHIVED]
                                                                            : []
                                         });

    readonly groupOptions = [
        {key: GROUP_STATUS_KEY, labelKey: 'entityList.group.status'},
        {key: GROUP_ALPHA_KEY, labelKey: 'entityList.group.alpha'}
    ];

    private readonly predicates: Record<string, (salon: ISalon) => boolean> = {
        [`period_${SalonState.NOW}`]: salon => salonState(salon) === SalonState.NOW,
        [`period_${SalonState.NEXT}`]: salon => salonState(salon) === SalonState.NEXT,
        [`period_${SalonState.PAST}`]: salon => salonState(salon) === SalonState.PAST,
        [`period_${SalonState.ARCHIVED}`]: salon => salonState(salon) === SalonState.ARCHIVED
    };

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.salons();

        return [
            {
                key: 'period',
                labelKey: 'entityList.filterGroup.period',
                mode: 'or',
                chips: SALON_STATE_ORDER.map(state => ({
                    key: `period_${state}`,
                    labelKey: `salon.list.stateGroup.${state}`,
                    dotColor: salonStateColor(state),
                    count: items.filter(this.predicates[`period_${state}`]).length,
                    alwaysVisible: true
                }))
            }
        ];
    });

    readonly filtered = computed<ISalon[]>(() => {
        const query = this.state.query();
        const searched = this.salons().filter(salon => matchesSearch([salon.place, salon.referenceNumber], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates);

        return [...filtered].sort(this.comparator());
    });

    readonly visible = computed(() => this.filtered().slice(0, this.visibleLimit()));

    readonly hasMore = computed(() => this.filtered().length > this.visibleLimit());

    readonly groups = computed<EntityGroup<ISalon>[]>(() => {
        const items = this.visible();

        if (this.state.groupBy() === GROUP_ALPHA_KEY) {
            return groupByAlphabet(items, salon => salon.place);
        }

        return groupByKey(items,
                          SALON_STATE_ORDER,
                          salon => salonState(salon),
                          key => `salon.list.stateGroup.${key}`,
                          key => salonStateColor(key));
    });

    /** « N salons · M actifs » (non archivés). */
    readonly subtitle = computed(() => {
        const total = this.salons().length;
        const active = this.salons().filter(salon => !salon.archived).length;
        const totalLabel = this.translateService.instant(total > 1
                                                         ? 'salon.list.countPlural'
                                                         : 'salon.list.countSingular') as string;
        const activeLabel = this.translateService.instant('salon.list.activeCount') as string;

        return `${total} ${totalLabel} · ${active} ${activeLabel}`;
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
        this.load();
    }

    load(): void {
        this.isLoading.set(true);

        this.salonService
            .query({includeArchived: true})
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(result => this.salons.set(result.body ?? []));
    }

    delete(target: HTMLElement, salon: ISalon): void {
        this.confirmDialogService.delete(target, 'salon.delete.question', {id: salon.place}).pipe(
            filter(confirmed => confirmed),
            switchMap(() => this.salonService.delete(salon.id)),
            tap(() => this.load())
        ).subscribe();
    }

    actionsFor(salon: ISalon): EntityAction[] {
        return this.rowActions().get(salon.id) ?? [];
    }

    /**
     * Les actions sont calculées une fois par jeu de données : un tableau recréé à
     * chaque détection de changement reconstruirait le menu sous le curseur, ce qui
     * obligerait à cliquer deux fois.
     */
    private readonly rowActions = computed(() => new Map<string, EntityAction[]>(
        this.visible().map(salon => [salon.id, this.buildActions(salon)])));

    private buildActions(salon: ISalon): EntityAction[] {
        return [
            {
                labelKey: 'entityList.action.detail',
                icon: 'pi pi-eye',
                routerLink: ['./', salon.id, 'view']
            },
            {
                labelKey: 'entityList.action.participations',
                icon: 'pi pi-list',
                routerLink: ['./', salon.id, 'participations']
            },
            {
                labelKey: 'entityList.action.stats',
                icon: 'pi pi-chart-bar',
                routerLink: ['./', salon.id, 'stats']
            },
            {
                labelKey: 'entityList.action.delete',
                icon: 'pi pi-trash',
                danger: true,
                separatorBefore: true,
                run: target => this.delete(target, salon)
            }
        ];
    }

    /** Résumé de groupe : « n participations ». */
    groupSummary(group: EntityGroup<ISalon>): string {
        const participations = group.items.reduce((sum, salon) => sum + (salon.nbParticipations ?? 0), 0);
        const label = this.translateService.instant(participations > 1
                                                    ? 'participation.list.countPlural'
                                                    : 'participation.list.countSingular') as string;

        return `${participations} ${label}`;
    }

    stateLabelKey(salon: ISalon): string {
        return `salon.list.state.${salonState(salon)}`;
    }

    stateColor(salon: ISalon): string {
        return salonStateColor(salonState(salon));
    }

    stateSuffix(salon: ISalon): string {
        return salonState(salon) === SalonState.NEXT ? daysBeforeOpening(salon) : '';
    }

    period(salon: ISalon): string {
        return salonPeriod(salon);
    }

    nbDimensions(salon: ISalon): number {
        return salon.priceStandSalons?.length ?? 0;
    }

    isCollapsed(group: EntityGroup<ISalon>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<ISalon>, collapsed: boolean): void {
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

    private comparator(): (a: ISalon, b: ISalon) => number {
        if (this.state.sort() === SORT_TITLE_KEY) {
            return (a, b) => compareAlpha(a.place, b.place) || compareDateDesc(a.startingDate, b.startingDate);
        }

        return (a, b) => compareDateDesc(a.startingDate, b.startingDate);
    }
}
