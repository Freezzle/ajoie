import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {ConfirmPopup} from 'primeng/confirmpopup';
import {ProgressSpinner} from 'primeng/progressspinner';
import {filter, switchMap, tap} from 'rxjs';
import {finalize} from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import {AlertErrorComponent} from 'app/shared/alert/alert-error.component';
import {ButtonBoxComponent} from 'app/shared/components/button-box/button-box.component';
import {ContentPageComponent} from 'app/shared/components/content-page/content-page.component';
import {MenuBoxComponent} from 'app/shared/components/menu-box/menu-box.component';
import {
    applyChipFilters,
    buildStatusChipGroup,
    categoryColor,
    compareAlpha,
    compareDateDesc,
    DISCARDED_STATUSES,
    EntityAction,
    EntityGroup,
    EntityListState,
    FilterChipGroup,
    GROUP_ALPHA_KEY,
    GROUP_CATEGORY_KEY,
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
import {EntityFootItemComponent} from 'app/shared/components/entity-list/entity-foot-item.component';
import {EntityHighlightComponent} from 'app/shared/components/entity-list/entity-highlight.component';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {EntityRowComponent} from 'app/shared/components/entity-list/entity-row.component';
import {EntityStatusComponent} from 'app/shared/components/entity-list/entity-status.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {NavigationStateService} from 'app/layouts/navbar/navigation-state.service';
import {copyToClipboard} from 'app/core/util/utils';
import {Category, formatterCategory} from '../../enumerations/category.model';
import {formatterStatus, Status} from '../../enumerations/status.model';
import {getExhibitorFullName, getFirstExhibitorName} from '../../exhibitor/model/exhibitor.interface';
import {IStand} from '../model/stand.interface';
import {StandService} from '../service/stand.service';

/** Nombre de lignes affichées avant le bouton « Afficher plus ». */
const PAGE_SIZE = 150;

const CATEGORY_ORDER: string[] = Object.keys(Category);

@Component({
               selector: 'app-stand',
               imports: [
                   SharedModule,
                   AlertErrorComponent,
                   ButtonBoxComponent,
                   ConfirmPopup,
                   ContentPageComponent,
                   MenuBoxComponent,
                   ProgressSpinner,
                   EntityFootItemComponent,
                   EntityHighlightComponent,
                   EntityListGroupComponent,
                   EntityListToolbarComponent,
                   EntityRowComponent,
                   EntityStatusComponent
               ],
               templateUrl: './stand.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class StandComponent implements OnInit {
    readonly stands = signal<IStand[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly idSalon = signal<string | null>(null);
    readonly idParticipation = signal<string | null>(null);
    /** La vue technique « presse-papiers » reste accessible depuis le menu ⋯. */
    readonly standardView = signal<boolean>(true);
    readonly visibleLimit = signal<number>(PAGE_SIZE);

    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly standService = inject(StandService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly translateService = inject(TranslateService);
    private readonly navigationStateService = inject(NavigationStateService);

    readonly state = new EntityListState({
                                             defaultGroupBy: GROUP_CATEGORY_KEY,
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
        {key: GROUP_CATEGORY_KEY, labelKey: 'entityList.group.category'},
        {key: GROUP_STATUS_KEY, labelKey: 'entityList.group.status'},
        {key: GROUP_ALPHA_KEY, labelKey: 'entityList.group.alpha'}
    ];

    private readonly predicates = computed<Record<string, (stand: IStand) => boolean>>(() => ({
        ...statusChipPredicates<IStand>(stand => stand.status),
        shared: (stand: IStand) => !!stand.shared,
        electricity: (stand: IStand) => !!stand.needElectricity,
        comment: (stand: IStand) => !!stand.extraInformation
    }));

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.stands();
        const predicates = this.predicates();

        return [
            buildStatusChipGroup(items, stand => stand.status, 'stand.list.statusGroup'),
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

    readonly filtered = computed<IStand[]>(() => {
        const query = this.state.query();
        const searched = this.stands().filter(stand => matchesSearch([
                                                                         stand.description,
                                                                         stand.participation?.therapistName,
                                                                         getExhibitorFullName(stand.participation?.exhibitor),
                                                                         ...(stand.subCategories ?? [])
                                                                     ], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates());

        return [...filtered].sort(this.comparator());
    });

    readonly visible = computed<IStand[]>(() => this.filtered().slice(0, this.visibleLimit()));

    readonly hasMore = computed(() => this.filtered().length > this.visibleLimit());

    readonly groups = computed<EntityGroup<IStand>[]>(() => {
        const items = this.visible();

        switch (this.state.groupBy()) {
            case GROUP_ALPHA_KEY:
                return groupByAlphabet(items, stand => stand.participation?.therapistName);
            case GROUP_STATUS_KEY:
                return groupByKey(items,
                                  STATUS_GROUP_ORDER,
                                  stand => stand.status,
                                  key => `stand.list.statusGroup.${key}`,
                                  key => statusColor(key as Status));
            default:
                return groupByKey(items,
                                  CATEGORY_ORDER,
                                  stand => stand.category ?? Category.NONE,
                                  key => formatterCategory(key as Category),
                                  key => categoryColor(key));
        }
    });

    readonly subtitle = computed(() => {
        const participationName = this.idParticipation()
                                  ? this.stands()[0]?.participation?.therapistName
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
        const count = this.stands().length;
        const key = count > 1 ? 'stand.list.countPlural' : 'stand.list.countSingular';

        return `${count} ${this.translateService.instant(key) as string}`;
    });

    readonly pageMenuItems = computed<MenuItem[]>(() => [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.load()
        },
        this.standardView()
        ? {
            label: this.translateService.instant('stand.viewClipboard') as string,
            icon: 'pi pi-clipboard',
            command: () => this.changeTechnicalView()
        }
        : {
            label: this.translateService.instant('stand.viewStandard') as string,
            icon: 'pi pi-list',
            command: () => this.standardView.set(true)
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
        this.isLoading.set(true);

        this.standService
            .query({idSalon: this.idSalon(), idParticipation: this.idParticipation()})
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(result => this.stands.set(result ?? []));
    }

    delete(target: HTMLElement, stand: IStand): void {
        this.confirmDialogService.delete(target, 'stand.delete.question', {description: stand.description})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.standService.delete(stand.id)),
                tap(() => this.load())
            )
            .subscribe();
    }

    actionsFor(stand: IStand): EntityAction[] {
        return this.rowActions().get(stand.id) ?? [];
    }

    /**
     * Les actions sont calculées une fois par jeu de données : un tableau recréé à
     * chaque détection de changement reconstruirait le menu sous le curseur, ce qui
     * obligerait à cliquer deux fois.
     */
    private readonly rowActions = computed(() => new Map<string, EntityAction[]>(
        this.visible().map(stand => [stand.id, this.buildActions(stand)])));

    private buildActions(stand: IStand): EntityAction[] {
        const idSalon = this.idSalon();
        const idParticipation = stand.participation?.id;
        const idExhibitor = stand.participation?.exhibitor?.id;

        return [
            {
                labelKey: 'entityList.action.detail',
                icon: 'pi pi-eye',
                routerLink: ['./', stand.id, 'view']
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
                run: target => this.delete(target, stand)
            }
        ];
    }

    /** Résumé affiché à droite d'un en-tête de groupe : « n actifs · m écartés ». */
    groupSummary(group: EntityGroup<IStand>): string {
        const discarded = group.items.filter(stand => DISCARDED_STATUSES.includes(stand.status)).length;
        const active = group.items.length - discarded;
        const activeLabel = this.translateService.instant(active > 1
                                                          ? 'stand.list.summary.activePlural'
                                                          : 'stand.list.summary.activeSingular') as string;

        if (discarded === 0) {
            return `${active} ${activeLabel}`;
        }

        const discardedLabel = this.translateService.instant(discarded > 1
                                                             ? 'stand.list.summary.discardedPlural'
                                                             : 'stand.list.summary.discardedSingular') as string;

        return `${active} ${activeLabel} · ${discarded} ${discardedLabel}`;
    }

    categoryLabelKey(stand: IStand): string {
        return formatterCategory(stand.category);
    }

    /** Libellé de la dimension, vide si le stand n'en a pas. */
    dimensionLabel(stand: IStand): string {
        return stand.dimension ? stand.dimension.dimension : '';
    }

    categoryColorOf(stand: IStand): string {
        return categoryColor(stand.category);
    }

    statusLabelKey(status: Status): string {
        return `stand.list.status.${status}`;
    }

    visibleTags(stand: IStand): string[] {
        return (stand.subCategories ?? []).slice(0, 3);
    }

    extraTags(stand: IStand): number {
        return Math.max(0, (stand.subCategories ?? []).length - 3);
    }

    isCollapsed(group: EntityGroup<IStand>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<IStand>, collapsed: boolean): void {
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

    clipboard(value: string | null | undefined): void {
        copyToClipboard(value);
    }

    /** Vue technique : tri par catégorie puis thérapeute, clic sur une cellule = copie. */
    changeTechnicalView(): void {
        this.stands.update(stands => [...stands].sort((a, b) => {
            const categoryA = a.category ?? '';
            const categoryB = b.category ?? '';

            if (categoryA !== categoryB) {
                return categoryA < categoryB ? -1 : 1;
            }

            return compareAlpha(a.participation?.therapistName, b.participation?.therapistName);
        }));

        this.standardView.set(false);
    }

    private comparator(): (a: IStand, b: IStand) => number {
        if (this.state.sort() === SORT_ALPHA_KEY) {
            return (a, b) => compareAlpha(a.participation?.therapistName, b.participation?.therapistName) ||
                             compareDateDesc(a.registrationDate, b.registrationDate);
        }

        return (a, b) => compareDateDesc(a.registrationDate, b.registrationDate);
    }

    protected readonly Status = Status;
    protected readonly Category = Category;
    protected readonly statusColor = statusColor;
    protected readonly formatterStatus = formatterStatus;
    protected readonly formatterCategory = formatterCategory;
    protected readonly getFirstExhibitorName = getFirstExhibitorName;
}
