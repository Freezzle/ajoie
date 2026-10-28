import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {Popover} from 'primeng/popover';

import SharedModule from '../../shared.module';
import {FootHelpDirective} from './foot-help.directive';

/**
 * Compteur du pied d'une ligne (« 2 stands »). Un compteur à 0 ne s'affiche pas.
 */
@Component({
               selector: 'entity-count',
               imports: [SharedModule, Popover, FootHelpDirective],
               templateUrl: './entity-count.component.html',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityCountComponent {
    readonly icon = input<string | null>(null);
    readonly count = input<number>(0);
    readonly singularKey = input.required<string>();
    readonly pluralKey = input.required<string>();
    /** Précision entre parenthèses, déjà traduite (« (dont partagé) »). */
    readonly detail = input<string | null>(null);
}
