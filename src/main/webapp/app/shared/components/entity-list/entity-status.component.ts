import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * Point coloré + libellé d'un statut, affiché en haut à droite d'une ligne de liste.
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
    readonly color = input<string>('var(--app-text-muted)');
    /** Les éléments annulés sont barrés. */
    readonly strikethrough = input<boolean>(false);
    /** Précision en gris à droite du libellé (par exemple « · J-22 »). */
    readonly suffix = input<string | null>(null);
}
