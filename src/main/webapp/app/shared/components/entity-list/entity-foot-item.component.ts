import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Popover} from 'primeng/popover';

import SharedModule from '../../shared.module';
import {FootHelpDirective} from './foot-help.directive';

/**
 * Élément du pied d'une ligne : icône + libellé (+ précision en gris).
 * Rien ne s'affiche si ni `labelKey` ni `label` ne sont fournis.
 *
 * Un libellé statique traduit (`labelKey`) n'est pas écrit dans le pied : seule
 * l'icône colorée est affichée, le texte restant accessible en infobulle. Les
 * valeurs dynamiques (`label`) et les précisions (`detail`) restent visibles.
 */
@Component({
               selector: 'entity-foot-item',
               imports: [SharedModule, Popover, FootHelpDirective],
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
    /** Force l'affichage du texte issu de `labelKey` à côté de l'icône. */
    readonly showLabel = input<boolean>(false);
    /** Anime l'icône, pour signaler un traitement en cours. */
    readonly spin = input<boolean>(false);
}
