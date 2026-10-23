import {Component, Input} from '@angular/core';
import {Tooltip} from 'primeng/tooltip';

import SharedModule from '../../shared.module';

/**
 * Petite icône « i » affichant une infobulle explicative à côté d'un libellé de champ.
 * Utiliser `textKey` pour une clé de traduction, ou `text` pour un texte déjà résolu.
 */
@Component({
               imports: [SharedModule, Tooltip],
               selector: 'info-icon',
               templateUrl: './info-icon.component.html',
               styleUrl: './info-icon.component.scss'
           })
export class InfoIconComponent {
    @Input() textKey: string | null = null;
    @Input() text: string | null = null;
}
