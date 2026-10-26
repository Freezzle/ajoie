import {ChangeDetectionStrategy, Component, computed, input, model, output} from '@angular/core';
import {RouterLink} from '@angular/router';

import SharedModule from '../../shared.module';
import {EntityActionsMenuComponent} from './entity-actions-menu.component';
import {EntityAction} from './entity-list.model';

/**
 * Carte d'une ligne de liste : deux niveaux (titre + statut, méta + côté droit),
 * puis un pied séparé par un trait pointillé qui porte le rouage d'actions.
 *
 * Le titre est un vrai lien dont le pseudo-élément couvre toute la carte
 * (« lien étendu ») : un clic n'importe où ouvre la fiche, Ctrl+clic ouvre un
 * nouvel onglet et Entrée fonctionne au clavier. Le rouage passe au-dessus.
 *
 * En mode `expandable`, le titre devient un bouton : un clic sur la carte déplie
 * le contenu projeté dans `[rowDetail]` au lieu de naviguer.
 */
@Component({
               selector: 'entity-row',
               imports: [SharedModule, RouterLink, EntityActionsMenuComponent],
               templateUrl: './entity-row.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityRowComponent {
    /** Commandes du `routerLink` vers la fiche existante, hors mode dépliable. */
    readonly link = input<unknown[] | null>(null);
    /** Libellé d'accessibilité du lien (« Ouvrir la fiche de la participation »). */
    readonly linkLabel = input<string>('');
    readonly actions = input<EntityAction[]>([]);
    /** Le clic sur la carte déplie le slot `[rowDetail]` au lieu de naviguer. */
    readonly expandable = input<boolean>(false);
    readonly expanded = model<boolean>(false);
    /** Une fois déplié, le rouage est repris par le contenu du détail. */
    readonly menuInDetail = input<boolean>(false);
    /** Émis à l'ouverture du menu, pour charger les actions à la demande. */
    readonly menuOpened = output<void>();

    /** Le rouage du pied disparaît quand le détail prend le relais. */
    readonly showMenu = computed(() => !(this.menuInDetail() && this.expanded()));

    toggle(): void {
        this.expanded.update(expanded => !expanded);
    }
}

