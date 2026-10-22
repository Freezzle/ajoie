import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MenuItem} from 'primeng/api';
import {Menu} from 'primeng/menu';

import SharedModule from '../../shared.module';
import {EntityAction} from './entity-list.model';

/**
 * Carte d'une ligne de liste : deux niveaux (titre + statut, méta + côté droit),
 * puis un pied séparé par un trait pointillé qui porte le rouage d'actions.
 *
 * Le titre est un vrai lien dont le pseudo-élément couvre toute la carte
 * (« lien étendu ») : un clic n'importe où ouvre la fiche, Ctrl+clic ouvre un
 * nouvel onglet et Entrée fonctionne au clavier. Le rouage passe au-dessus.
 */
@Component({
               selector: 'entity-row',
               imports: [SharedModule, RouterLink, Menu],
               templateUrl: './entity-row.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityRowComponent {
    /** Commandes du `routerLink` vers la fiche existante. */
    readonly link = input.required<unknown[]>();
    /** Libellé d'accessibilité du lien (« Ouvrir la fiche de la participation »). */
    readonly linkLabel = input<string>('');
    readonly actions = input<EntityAction[]>([]);

    private readonly translateService = inject(TranslateService);
    private readonly gear = viewChild<ElementRef<HTMLButtonElement>>('gear');

    readonly actionsLabel = computed(() => this.translateService.instant('entityList.actions') as string);

    readonly menuItems = computed<MenuItem[]>(() => {
        const items: MenuItem[] = [];

        this.actions().filter(action => !action.hidden).forEach(action => {
            if (action.separatorBefore && items.length > 0) {
                items.push({separator: true});
            }

            items.push({
                           label: this.translateService.instant(action.labelKey) as string,
                           icon: action.icon,
                           routerLink: action.routerLink,
                           styleClass: action.danger ? 'el-menu-danger' : undefined,
                           command: action.run ? () => action.run!(this.gear()!.nativeElement) : undefined
                       });
        });

        return items;
    });
}
