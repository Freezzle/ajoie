import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import SharedModule from '../../shared.module';

/** Teintes disponibles pour un petit bouton d'action. */
export type ActionIconVariant = 'neutral' | 'danger';

/**
 * Petit bouton d'action carré, ne contenant qu'une icône (même gabarit que le rouage
 * d'une ligne de liste). Utiliser `labelKey` pour une clé de traduction, ou `label`
 * pour un texte déjà résolu : il sert d'infobulle et de libellé d'accessibilité.
 */
@Component({
               imports: [SharedModule],
               selector: 'action-icon-box',
               templateUrl: './action-icon-box.component.html',
               styleUrl: './action-icon-box.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class ActionIconBoxComponent {
    /** Icône PrimeNG, par exemple `pi-trash`. */
    readonly primeIcon = input.required<string>();
    readonly labelKey = input<string | null>(null);
    readonly label = input<string | null>(null);
    readonly variant = input<ActionIconVariant>('neutral');
    readonly isDisabled = input(false);

    /** Émet le bouton cliqué, utilisable comme ancre d'une popup de confirmation. */
    readonly clickedEvent = output<HTMLElement>();

    onClick(event: MouseEvent): void {
        // Le bouton est souvent imbriqué dans une ligne cliquable : on évite de la déclencher.
        event.stopPropagation();
        this.clickedEvent.emit(event.currentTarget as HTMLElement);
    }
}
