import {Component, Input} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * Carte de regroupement réutilisable : titre, aide optionnelle et contenu projeté.
 */
@Component({
               selector: 'app-registration-card',
               imports: [SharedModule],
               templateUrl: './registration-card.component.html',
               styleUrl: './registration-card.component.scss'
           })
export class RegistrationCardComponent {
    @Input() titleKey: string | null = null;
    @Input() title: string | null = null;
    @Input() helpKey: string | null = null;
}
