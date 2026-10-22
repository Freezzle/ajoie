import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {ConfirmPopup} from 'primeng/confirmpopup';

import SharedModule from 'app/shared/shared.module';
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
    SORT_TITLE_KEY,
    STATUS_COLLAPSED_BY_DEFAULT,
    STATUS_GROUP_ORDER,
    statusChipPredicates,
    statusColor
} from 'app/shared/components/entity-list';
import {EntityFootItemComponent} from 'app/shared/components/entity-list/entity-foot-item.component';
import {EntityHighlightComponent} from 'app/shared/components/entity-list/entity-highlight.component';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {EntityRowComponent} from 'app/shared/components/entity-list/entity-row.component';
import {EntityStatusComponent} from 'app/shared/components/entity-list/entity-status.component';
import {NavigationStateService} from 'app/layouts/navbar/navigation-state.service';
import {Status} from '../../enumerations/status.model';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';
import {ITalk} from './talk-list.model';

/** Nombre de lignes affichées avant le bouton « Afficher plus ». */
const PAGE_SIZE = 150;

/**
 * Rendu commun aux conférences et aux ateliers : les deux modèles sont identiques,
 * seules les clés de traduction et le service changent.
 */
@Component({
               selector: 'app-talk-list',
               imports: [
                   SharedModule,
                   AlertErrorComponent,
                   ButtonBoxComponent,
                   ConfirmPopup,
                   ContentPageComponent,
                   MenuBoxComponent,
                   EntityFootItemComponent,
                   EntityHighlightComponent,
                   EntityListGroupComponent,
                   EntityListToolbarComponent,
                   EntityRowComponent,
                   EntityStatusComponent
               ],
               templateUrl: './talk-list.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class TalkListComponent {
    readonly items = input<ITalk[]>([]);
    readonly isLoading = input<boolean>(false);
    /** `conference` ou `workshop` : préfixe de toutes les clés de traduction. */
    readonly i18nPrefix = input.required<string>();
    readonly idSalon = input<string | null>(null);
    readonly idParticipation = input<string | null>(null);

    readonly refreshRequested = output<void>();
    readonly deleteRequested = output<{ item: ITalk; target: HTMLElement }>();

    protected readonly router = inject(Router);
    protected readonly activatedRoute = inject(ActivatedRoute);
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
                                                 },
                                                 {
                                                     key: SORT_TITLE_KEY,
                                                     labelKey: 'entityList.sort.title',
                                                     hintKey: 'entityList.sort.hint.title'
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

    /** Tranche affichée : le bouton « Afficher plus » l'agrandit. */
    readonly visibleLimit = signal<number>(PAGE_SIZE);

    private readonly predicates = computed<Record<string, (talk: ITalk) => boolean>>(() => ({
        ...statusChipPredicates<ITalk>(talk => talk.status),
        comment: (talk: ITalk) => !!talk.extraInformation
    }));

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.items();
        const predicates = this.predicates();

        return [
            buildStatusChipGroup(items, talk => talk.status, `${this.i18nPrefix()}.list.statusGroup`),
            {
                key: 'signals',
                labelKey: 'entityList.filterGroup.signals',
                mode: 'and',
                chips: [
                    {
                        key: 'comment',
                        labelKey: 'entityList.signal.comment',
                        icon: 'note-sticky',
                        color: 'var(--app-text)',
                        count: items.filter(predicates['comment']).length
                    }
                ]
            }
        ];
    });

    readonly filtered = computed<ITalk[]>(() => {
        const query = this.state.query();
        const searched = this.items().filter(talk => matchesSearch([
                                                                       talk.title,
                                                                       talk.description,
                                                                       talk.participation?.therapistName,
                                                                       getExhibitorFullName(talk.participation?.exhibitor)
                                                                   ], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates());

        return [...filtered].sort(this.comparator());
    });

    readonly visible = computed<ITalk[]>(() => this.filtered().slice(0, this.visibleLimit()));

    readonly hasMore = computed(() => this.filtered().length > this.visibleLimit());

    readonly groups = computed<EntityGroup<ITalk>[]>(() => {
        const items = this.visible();

        if (this.state.groupBy() === GROUP_ALPHA_KEY) {
            return groupByAlphabet(items, talk => talk.participation?.therapistName);
        }

        return groupByKey(items,
                          STATUS_GROUP_ORDER,
                          talk => talk.status,
                          key => `${this.i18nPrefix()}.list.statusGroup.${key}`,
                          key => statusColor(key as Status));
    });

    readonly subtitle = computed(() => {
        const participationName = this.idParticipation()
                                  ? this.items()[0]?.participation?.therapistName
                                  : null;

        if (participationName) {
            return this.translateService.instant('entityList.context.participation',
                                                 {name: participationName}) as string;
        }

        const salon = this.navigationStateService.salon();
        const idSalon = this.idSalon();

        return !salon || (idSalon && salon.id !== idSalon) ? '' : salon.place;
    });

    readonly countLabel = computed(() => {
        const count = this.items().length;
        const key = count > 1 ? `${this.i18nPrefix()}.list.countPlural` : `${this.i18nPrefix()}.list.countSingular`;

        return `${count} ${this.translateService.instant(key) as string}`;
    });

    readonly pageMenuItems = computed<MenuItem[]>(() => [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.refreshRequested.emit()
        }
    ]);

    constructor() {
        this.state.connectQueryParams(this.activatedRoute, this.router);
    }

    actionsFor(talk: ITalk): EntityAction[] {
        return this.rowActions().get(talk.id) ?? [];
    }

    /**
     * Les actions sont calculées une fois par jeu de données : un tableau recréé à
     * chaque détection de changement reconstruirait le menu sous le curseur, ce qui
     * obligerait à cliquer deux fois.
     */
    private readonly rowActions = computed(() => new Map<string, EntityAction[]>(
        this.visible().map(talk => [talk.id, this.buildActions(talk)])));

    private buildActions(talk: ITalk): EntityAction[] {
        const idSalon = this.idSalon();
        const idParticipation = talk.participation?.id;
        const idExhibitor = talk.participation?.exhibitor?.id;

        return [
            {
                labelKey: 'entityList.action.detail',
                icon: 'pi pi-eye',
                routerLink: ['./', talk.id, 'view']
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
                labelKey: 'entityList.action.delete',
                icon: 'pi pi-trash',
                danger: true,
                separatorBefore: true,
                run: target => this.deleteRequested.emit({item: talk, target})
            }
        ];
    }

    statusLabelKey(status: Status): string {
        return `${this.i18nPrefix()}.list.status.${status}`;
    }

    isCollapsed(group: EntityGroup<ITalk>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<ITalk>, collapsed: boolean): void {
        this.state.setCollapsed(group.key, collapsed);
    }

    create(): void {
        void this.router.navigate(['./new'], {relativeTo: this.activatedRoute});
    }

    previousState(): void {
        window.history.back();
    }

    showMore(): void {
        this.visibleLimit.update(limit => limit + PAGE_SIZE);
    }

    private comparator(): (a: ITalk, b: ITalk) => number {
        switch (this.state.sort()) {
            case SORT_ALPHA_KEY:
                return (a, b) => compareAlpha(a.participation?.therapistName, b.participation?.therapistName) ||
                                 compareDateDesc(a.registrationDate, b.registrationDate);
            case SORT_TITLE_KEY:
                return (a, b) => compareAlpha(a.title, b.title) ||
                                 compareDateDesc(a.registrationDate, b.registrationDate);
            default:
                return (a, b) => compareDateDesc(a.registrationDate, b.registrationDate);
        }
    }

    protected readonly Status = Status;
    protected readonly statusColor = statusColor;
}
