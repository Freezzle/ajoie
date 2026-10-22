import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * Élément du pied d'une ligne : icône + libellé (+ précision en gris).
 * Rien ne s'affiche si ni `labelKey` ni `label` ne sont fournis.
 */
@Component({
               selector: 'entity-foot-item',
               imports: [SharedModule],
               templateUrl: './entity-foot-item.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityFootItemComponent {
    /** Icône FontAwesome, sans préfixe (`note-sticky`, `gift`…). */
    readonly icon = input<string | null>(null);
    readonly labelKey = input<string | null>(null);
    readonly label = input<string | null>(null);
    /** Texte secondaire en gris, coupé s'il est trop long. */
    readonly detail = input<string | null>(null);
    readonly color = input<string>('var(--app-text)');
}
