import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {Popover} from 'primeng/popover';

import SharedModule from '../../shared.module';
import {GroupOption, SortOption} from './entity-list.model';

/**
 * Bouton icône « Grouper et trier » et son menu à boutons radio.
 *
 * Un choix s'applique immédiatement et le menu reste ouvert ; il se ferme au clic
 * à l'extérieur ou avec Échap. Le bouton est mis en évidence quand le groupement
 * ou le tri n'est pas celui par défaut.
 */
@Component({
               selector: 'entity-group-sort-menu',
               imports: [SharedModule, Popover],
               templateUrl: './entity-group-sort-menu.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityGroupSortMenuComponent {
    readonly groupBy = model.required<string>();
    readonly groupOptions = input<GroupOption[]>([]);
    readonly sort = model.required<string>();
    /** Déjà filtrées selon le groupement courant. */
    readonly sortOptions = input<SortOption[]>([]);
    readonly isDefault = input<boolean>(true);

    selectGroup(key: string): void {
        if (this.groupBy() !== key) {
            this.groupBy.set(key);
        }
    }

    selectSort(key: string): void {
        if (this.sort() !== key) {
            this.sort.set(key);
        }
    }
}
