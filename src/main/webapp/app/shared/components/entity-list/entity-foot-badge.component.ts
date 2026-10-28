import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Popover} from 'primeng/popover';

import SharedModule from '../../shared.module';
import {FootHelpDirective} from './foot-help.directive';

/**
 * Élément du pied d'une ligne réduit à une icône colorée, accompagnée d'une
 * pastille avec le nombre lorsqu'il y en a plusieurs.
 * Rien ne s'affiche tant que `count` est nul.
 */
@Component({
               selector: 'entity-foot-badge',
               imports: [SharedModule, Popover, FootHelpDirective],
               templateUrl: './entity-foot-badge.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityFootBadgeComponent {
    /** Icône FontAwesome, sans préfixe (`file-circle-check`, `clock`…). */
    readonly icon = input.required<string>();
    readonly count = input<number>(0);
    /** Libellé traduit, affiché en infobulle uniquement. */
    readonly labelKey = input.required<string>();
    readonly color = input<string>('var(--app-text)');
}
