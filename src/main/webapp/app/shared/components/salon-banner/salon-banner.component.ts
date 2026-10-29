import {Component, input} from '@angular/core';

import SharedModule from '../../shared.module';

/**
 * Bandeau rappelant le salon concerné et ses dates, affiché en haut de chaque écran
 * des parcours publics (inscription exposant et inscription bénévole).
 * Extrait de registration.component.html pour être partagé.
 */
@Component({
               selector: 'app-salon-banner',
               standalone: true,
               imports: [SharedModule],
               templateUrl: './salon-banner.component.html',
               styleUrl: './salon-banner.component.scss'
           })
export class SalonBannerComponent {
    readonly place = input.required<string>();
    readonly dates = input<string | null>(null);
}
