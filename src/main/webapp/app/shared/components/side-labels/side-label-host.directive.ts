import {Directive} from '@angular/core';

/** Sur la box : position relative, conteneur de requêtes, colonne réservée à droite. */
@Directive({
               selector: '[appSideLabelHost]',
               standalone: true,
               host: {class: 'app-side-host'}
           })
export class SideLabelHostDirective {
}
