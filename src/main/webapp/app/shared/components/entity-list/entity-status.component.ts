import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * Statut d'une ligne de liste, affiché en pastille pleine en haut à droite : fond de la
 * couleur du statut, libellé en blanc.
 * Le libellé est une clé de traduction : chaque écran fournit la sienne (masculin / féminin).
 */
@Component({
               selector: 'entity-status',
               imports: [SharedModule],
               templateUrl: './entity-status.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityStatusComponent {
    /** Clé de traduction du libellé ; rien ne s'affiche si elle est absente. */
    readonly labelKey = input<string | null>(null);
    readonly color = input<string>('var(--app-status-neutral)');
    /** Les éléments annulés sont barrés. */
    readonly strikethrough = input<boolean>(false);
    /** Précision en gris à droite du libellé (par exemple « · J-22 »). */
    readonly suffix = input<string | null>(null);
}
