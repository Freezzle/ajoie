import {Component, Input} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * Affiche une valeur booléenne (Oui/Non) sous forme d'icône :
 * coche verte si vrai, croix rouge si faux. Réutilise les couleurs du projet
 * (`--app-status-validated` / `--app-status-refused`).
 */
@Component({
               imports: [SharedModule],
               selector: 'yes-no-icon',
               templateUrl: './yes-no-icon.component.html',
               styleUrl: './yes-no-icon.component.scss'
           })
export class YesNoIconComponent {
    @Input() value: boolean | null | undefined = false;
}
