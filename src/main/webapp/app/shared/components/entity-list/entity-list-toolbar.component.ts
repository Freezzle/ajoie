import {ChangeDetectionStrategy, Component, computed, input, model} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';

import SharedModule from '../../shared.module';
import {EntityGroupSortMenuComponent} from './entity-group-sort-menu.component';
import {FilterChip, FilterChipGroup, GroupOption, SortOption} from './entity-list.model';

/**
 * Barre d'outils commune : recherche, bouton « Grouper et trier » et rangée de puces.
 *
 * Les puces sont organisées en groupes précédés d'un petit libellé ; celles dont
 * l'effectif est nul sont masquées, sauf les statuts et les périodes.
 */
@Component({
               selector: 'entity-list-toolbar',
               imports: [SharedModule, FormsModule, IconField, InputIcon, InputText, EntityGroupSortMenuComponent],
               templateUrl: './entity-list-toolbar.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityListToolbarComponent {
    readonly query = model<string>('');
    readonly placeholderKey = input<string>('entityList.search');

    readonly groupBy = model.required<string>();
    readonly groupOptions = input<GroupOption[]>([]);
    readonly sort = model.required<string>();
    readonly sortOptions = input<SortOption[]>([]);
    readonly isDefault = input<boolean>(true);

    readonly chipGroups = input<FilterChipGroup[]>([]);
    readonly activeChips = model<string[]>([]);

    readonly visibleGroups = computed(() => this.chipGroups()
                                                .map(group => ({
                                                    ...group,
                                                    chips: group.chips.filter(chip => chip.alwaysVisible === true ||
                                                                                      chip.count > 0 ||
                                                                                      this.isActive(chip))
                                                }))
                                                .filter(group => group.chips.length > 0));

    isActive(chip: FilterChip): boolean {
        return this.activeChips().includes(chip.key);
    }

    toggleChip(chip: FilterChip): void {
        const active = this.activeChips();

        this.activeChips.set(active.includes(chip.key)
                             ? active.filter(key => key !== chip.key)
                             : [...active, chip.key]);
    }
}
