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
    EntityAction,
    EntityGroup,
    EntityListState,
    FilterChipGroup,
    GROUP_ALPHA_KEY,
    groupByAlphabet,
    matchesSearch
} from 'app/shared/components/entity-list';
import {EntityCountComponent} from 'app/shared/components/entity-list/entity-count.component';
import {EntityFootItemComponent} from 'app/shared/components/entity-list/entity-foot-item.component';
import {EntityHighlightComponent} from 'app/shared/components/entity-list/entity-highlight.component';
import {EntityListGroupComponent} from 'app/shared/components/entity-list/entity-list-group.component';
import {EntityListToolbarComponent} from 'app/shared/components/entity-list/entity-list-toolbar.component';
import {EntityRowComponent} from 'app/shared/components/entity-list/entity-row.component';
import {EntityStatusComponent} from 'app/shared/components/entity-list/entity-status.component';
import {ConfirmDialogService} from 'app/shared/delete-dialog/confirm-dialog.service';
import {copyToClipboard} from 'app/core/util/utils';
import {getExhibitorFullName, IExhibitor} from '../model/exhibitor.interface';
import {ExhibitorService} from '../service/exhibitor.service';

/** Nombre de lignes affichées avant le bouton « Afficher plus ». */
const PAGE_SIZE = 150;

const SORT_LAST_NAME = 'lastName';
const SORT_FIRST_NAME = 'firstName';
const SORT_CITY = 'city';

@Component({
               selector: 'app-exhibitor',
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
               templateUrl: './exhibitor.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ExhibitorComponent implements OnInit {
    readonly exhibitors = signal<IExhibitor[]>([]);
    readonly isLoading = signal<boolean>(false);
    readonly visibleLimit = signal<number>(PAGE_SIZE);

    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly exhibitorService = inject(ExhibitorService);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly translateService = inject(TranslateService);

    /** Un client n'a pas de statut : on groupe toujours par initiale du nom de famille. */
    readonly state = new EntityListState({
                                             defaultGroupBy: GROUP_ALPHA_KEY,
                                             defaultSort: SORT_LAST_NAME,
                                             sortOptions: [
                                                 {
                                                     key: SORT_LAST_NAME,
                                                     labelKey: 'exhibitor.list.sort.lastName',
                                                     hintKey: 'entityList.sort.hint.lastName'
                                                 },
                                                 {
                                                     key: SORT_FIRST_NAME,
                                                     labelKey: 'exhibitor.list.sort.firstName',
                                                     hintKey: 'entityList.sort.hint.firstName'
                                                 },
                                                 {
                                                     key: SORT_CITY,
                                                     labelKey: 'exhibitor.list.sort.city',
                                                     hintKey: 'entityList.sort.hint.city'
                                                 }
                                             ],
                                             collapsedByDefault: () => []
                                         });

    readonly groupOptions = [
        {key: GROUP_ALPHA_KEY, labelKey: 'entityList.group.alpha'}
    ];

    private readonly predicates: Record<string, (exhibitor: IExhibitor) => boolean> = {
        redFlag: exhibitor => exhibitor.redFlag,
        duplicate: exhibitor => exhibitor.duplicateDetected,
        newsletter: exhibitor => exhibitor.newsletter,
        comment: exhibitor => !!exhibitor.extraInformation,
        noParticipation: exhibitor => (exhibitor.nbParticipations ?? 0) === 0
    };

    readonly chipGroups = computed<FilterChipGroup[]>(() => {
        const items = this.exhibitors();
        const count = (key: string): number => items.filter(this.predicates[key]).length;

        return [
            {
                key: 'signals',
                labelKey: 'entityList.filterGroup.signals',
                mode: 'and',
                chips: [
                    {
                        key: 'redFlag',
                        labelKey: 'exhibitor.list.signal.redFlag',
                        icon: 'flag',
                        color: 'var(--app-status-refused)',
                        count: count('redFlag')
                    },
                    {
                        key: 'duplicate',
                        labelKey: 'exhibitor.list.signal.duplicate',
                        icon: 'triangle-exclamation',
                        color: 'var(--app-warn)',
                        count: count('duplicate')
                    },
                    {
                        key: 'newsletter',
                        labelKey: 'exhibitor.list.signal.newsletter',
                        icon: 'envelope',
                        color: 'var(--app-status-accepted)',
                        count: count('newsletter')
                    },
                    {
                        key: 'comment',
                        labelKey: 'exhibitor.list.signal.comment',
                        icon: 'note-sticky',
                        color: 'var(--app-text)',
                        count: count('comment')
                    },
                    {
                        key: 'noParticipation',
                        labelKey: 'exhibitor.list.signal.noParticipation',
                        icon: 'user-slash',
                        color: 'var(--app-text-muted)',
                        count: count('noParticipation')
                    }
                ]
            }
        ];
    });

    readonly filtered = computed<IExhibitor[]>(() => {
        const query = this.state.query();
        const searched = this.exhibitors().filter(exhibitor => matchesSearch([
                                                                                 exhibitor.firstName,
                                                                                 exhibitor.lastName,
                                                                                 exhibitor.email,
                                                                                 exhibitor.phoneNumber,
                                                                                 this.city(exhibitor)
                                                                             ], query));

        const filtered = applyChipFilters(searched,
                                          this.chipGroups(),
                                          new Set(this.state.activeChips()),
                                          this.predicates);

        return [...filtered].sort(this.comparator());
    });

    readonly visible = computed(() => this.filtered().slice(0, this.visibleLimit()));

    readonly hasMore = computed(() => this.filtered().length > this.visibleLimit());

    readonly groups = computed<EntityGroup<IExhibitor>[]>(
        () => groupByAlphabet(this.visible(), exhibitor => exhibitor.lastName));

    readonly subtitle = computed(() => {
        const count = this.exhibitors().length;
        const key = count > 1 ? 'exhibitor.list.countPlural' : 'exhibitor.list.countSingular';

        return `${count} ${this.translateService.instant(key) as string}`;
    });

    readonly pageMenuItems = computed<MenuItem[]>(() => [
        {
            label: this.translateService.instant('common.refresh') as string,
            icon: 'pi pi-sync',
            command: () => this.load()
        },
        {
            label: this.translateService.instant('exhibitor.copyNewsletter') as string,
            icon: 'pi pi-copy',
            command: () => this.clipboardNewsLetterExhibitors()
        }
    ]);

    /**
     * Les actions sont calculées une fois par jeu de données : un tableau recréé à
     * chaque détection de changement reconstruirait le menu sous le curseur, ce qui
     * obligerait à cliquer deux fois.
     */
    private readonly rowActions = computed(() => new Map<string, EntityAction[]>(
        this.visible().map(exhibitor => [exhibitor.id, this.buildActions(exhibitor)])));

    constructor() {
        this.state.connectQueryParams(this.activatedRoute, this.router);
    }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.isLoading.set(true);

        this.exhibitorService
            .query()
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(result => this.exhibitors.set(result.body ?? []));
    }

    delete(target: HTMLElement, exhibitor: IExhibitor): void {
        this.confirmDialogService.delete(target, 'exhibitor.delete.question',
                                         {id: getExhibitorFullName(exhibitor)})
            .pipe(
                filter(confirmed => confirmed),
                switchMap(() => this.exhibitorService.delete(exhibitor.id)),
                tap(() => this.load())
            ).subscribe();
    }

    clipboardNewsLetterExhibitors(): void {
        this.isLoading.set(true);

        this.exhibitorService.getExhibitorsWithActiveNewsletter()
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(exhibitors => copyToClipboard(exhibitors.map(exhibitor => exhibitor.email).join(',')));
    }

    actionsFor(exhibitor: IExhibitor): EntityAction[] {
        return this.rowActions().get(exhibitor.id) ?? [];
    }

    fullName(exhibitor: IExhibitor): string {
        return getExhibitorFullName(exhibitor);
    }

    /** Localité du domicile, utilisée en tri, en recherche et dans le pied. */
    city(exhibitor: IExhibitor): string {
        return exhibitor.homeAddress?.city ?? '';
    }

    languageLabelKey(exhibitor: IExhibitor): string | null {
        return exhibitor.language ? `exhibitor.language.list.${exhibitor.language}` : null;
    }

    /** « Bloqué » prime sur « Doublon » ; rien si le client n'a aucun signalement. */
    statusLabelKey(exhibitor: IExhibitor): string | null {
        if (exhibitor.redFlag) {
            return 'exhibitor.list.status.redFlag';
        }

        return exhibitor.duplicateDetected ? 'exhibitor.list.status.duplicate' : null;
    }

    statusColor(exhibitor: IExhibitor): string {
        return exhibitor.redFlag ? 'var(--app-status-refused)' : 'var(--app-warn)';
    }

    /** Résumé de groupe : « n participations ». */
    groupSummary(group: EntityGroup<IExhibitor>): string {
        const participations = group.items.reduce((sum, exhibitor) => sum + (exhibitor.nbParticipations ?? 0), 0);
        const label = this.translateService.instant(participations > 1
                                                    ? 'exhibitor.list.foot.participationPlural'
                                                    : 'exhibitor.list.foot.participationSingular') as string;

        return `${participations} ${label}`;
    }

    isCollapsed(group: EntityGroup<IExhibitor>): boolean {
        return this.state.isCollapsed(group.key);
    }

    setCollapsed(group: EntityGroup<IExhibitor>, collapsed: boolean): void {
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

    private buildActions(exhibitor: IExhibitor): EntityAction[] {
        return [
            {
                labelKey: 'entityList.action.detail',
                icon: 'pi pi-eye',
                routerLink: ['./', exhibitor.id, 'view']
            },
            {
                labelKey: 'entityList.action.copyEmail',
                icon: 'pi pi-copy',
                run: () => copyToClipboard(exhibitor.email),
                hidden: !exhibitor.email
            },
            {
                labelKey: 'entityList.action.delete',
                icon: 'pi pi-trash',
                danger: true,
                separatorBefore: true,
                run: target => this.delete(target, exhibitor)
            }
        ];
    }

    private comparator(): (a: IExhibitor, b: IExhibitor) => number {
        switch (this.state.sort()) {
            case SORT_FIRST_NAME:
                return (a, b) => compareAlpha(a.firstName, b.firstName) || compareAlpha(a.lastName, b.lastName);
            case SORT_CITY:
                return (a, b) => compareAlpha(this.city(a), this.city(b)) || compareAlpha(a.lastName, b.lastName);
            default:
                return (a, b) => compareAlpha(a.lastName, b.lastName) || compareAlpha(a.firstName, b.firstName);
        }
    }
}
