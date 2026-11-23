import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {Notif} from './notif.model';

@Component({
               selector: 'app-notif-badge',
               standalone: true,
               templateUrl: './notif-badge.component.html',
               styleUrl: './notif-badge.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush,
               host: {'aria-hidden': 'true'}
           })
export class NotifBadgeComponent {
    readonly notif = input.required<Notif | null>();

    readonly isCount = computed(() => this.notif()?.type === 'count');

    /** Affiche un point (pas de texte) si demandé ou si aucune valeur n'est fournie. */
    readonly isDot = computed(() => {
        const notif = this.notif();
        if (!notif || notif.type === 'count') {
            return false;
        }

        return notif.dot === true || notif.value === undefined || notif.value === null;
    });

    readonly displayValue = computed(() => {
        const value = this.notif()?.value;

        return value === undefined || value === null ? '' : String(value);
    });
}
