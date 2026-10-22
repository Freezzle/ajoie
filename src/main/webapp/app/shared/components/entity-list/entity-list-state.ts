import {effect, signal, untracked} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {availableSorts} from './entity-list.utils';
import {SortOption} from './entity-list.model';

export interface EntityListStateOptions {
    defaultGroupBy: string;
    defaultSort: string;
    sortOptions: SortOption[];
    /** Le tri alphabétique porte sur la même clé que le tri par titre (salons). */
    alphaIsTitle?: boolean;
    /** Groupes repliés par défaut, pour un groupement donné. */
    collapsedByDefault: (groupBy: string) => string[];
}

/**
 * État partagé d'un écran de liste : recherche, groupement, tri, puces actives et
 * groupes repliés, synchronisés avec les query params (`?q=…&group=…&sort=…&f=…`).
 */
export class EntityListState {
    readonly query = signal<string>('');
    readonly groupBy = signal<string>('');
    readonly sort = signal<string>('');
    readonly activeChips = signal<string[]>([]);
    readonly collapsedGroups = signal<string[]>([]);

    constructor(private readonly options: EntityListStateOptions) {
        this.groupBy.set(options.defaultGroupBy);
        this.sort.set(options.defaultSort);
        this.collapsedGroups.set(options.collapsedByDefault(options.defaultGroupBy));
    }

    /** Options de tri réellement proposées pour le groupement courant. */
    get sortOptions(): SortOption[] {
        return availableSorts(this.groupBy(), this.options.sortOptions, this.options.alphaIsTitle);
    }

    /** Vrai quand le groupement et le tri sont ceux par défaut. */
    get isDefault(): boolean {
        return this.groupBy() === this.options.defaultGroupBy && this.sort() === this.options.defaultSort;
    }

    /** Vrai dès qu'une recherche ou un filtre est actif : tous les groupes s'ouvrent. */
    get isFiltering(): boolean {
        return this.query().trim().length > 0 || this.activeChips().length > 0;
    }

    isCollapsed(groupKey: string): boolean {
        return !this.isFiltering && this.collapsedGroups().includes(groupKey);
    }

    setCollapsed(groupKey: string, collapsed: boolean): void {
        const current = this.collapsedGroups();

        this.collapsedGroups.set(collapsed
                                 ? [...new Set([...current, groupKey])]
                                 : current.filter(key => key !== groupKey));
    }

    /** Changer de groupement réinitialise les groupes repliés et le tri redondant. */
    setGroupBy(groupBy: string): void {
        if (this.groupBy() === groupBy) {
            return;
        }

        this.groupBy.set(groupBy);
        this.collapsedGroups.set(this.options.collapsedByDefault(groupBy));

        if (!this.sortOptions.some(option => option.key === this.sort())) {
            this.sort.set(this.options.defaultSort);
        }
    }

    clearFilters(): void {
        this.query.set('');
        this.activeChips.set([]);
    }

    /**
     * Lit l'état initial des query params puis les tient à jour.
     * À appeler depuis un contexte d'injection (constructeur du composant).
     */
    connectQueryParams(route: ActivatedRoute, router: Router): void {
        const params = route.snapshot.queryParamMap;

        const group = params.get('group');
        if (group) {
            this.setGroupBy(group);
        }

        const sort = params.get('sort');
        if (sort && this.sortOptions.some(option => option.key === sort)) {
            this.sort.set(sort);
        }

        this.query.set(params.get('q') ?? '');

        const chips = params.get('f');
        this.activeChips.set(chips ? chips.split(',').filter(Boolean) : []);

        effect(() => {
            const queryParams = {
                q: this.query() || null,
                group: this.groupBy() === this.options.defaultGroupBy ? null : this.groupBy(),
                sort: this.sort() === this.options.defaultSort ? null : this.sort(),
                f: this.activeChips().length > 0 ? this.activeChips().join(',') : null
            };

            untracked(() => void router.navigate([], {
                relativeTo: route,
                queryParams,
                queryParamsHandling: 'merge',
                replaceUrl: true
            }));
        });
    }
}
