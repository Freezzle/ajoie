import {Component, input} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {YesNoBoxComponent} from '../../shared/components/yes-no-box/yes-no-box.component';
import {AvailabilityFriseComponent} from '../availability-frise/availability-frise.component';
import {FriseSlot, totalHours} from '../volunteer-availability.util';

/**
 * Carte d'un jour du parcours bénévole : pastille date, titre, description, Oui/Non et frise.
 * Liée à un FormGroup `{dayId, available, slots}`.
 */
@Component({
               selector: 'app-volunteer-day-card',
               standalone: true,
               imports: [ReactiveFormsModule, TranslatePipe, YesNoBoxComponent, AvailabilityFriseComponent],
               templateUrl: './volunteer-day-card.component.html',
               styleUrl: './volunteer-day-card.component.scss'
           })
export class VolunteerDayCardComponent {
    readonly group = input.required<FormGroup>();
    readonly slots = input.required<FriseSlot[]>();
    readonly title = input<string>('');
    readonly dateAbbrev = input<string | null>(null);
    readonly dateNum = input<string | null>(null);
    readonly description = input<string | null>(null);
    readonly openingLabel = input<string>('');
    readonly showErrors = input<boolean>(false);

    get available(): boolean | null {
        return this.group().get('available')?.value ?? null;
    }

    get selectedSlots(): number[] {
        return this.group().get('slots')?.value ?? [];
    }

    get hours(): number {
        return totalHours(this.slots(), this.selectedSlots);
    }

    get answerRequired(): boolean {
        return this.showErrors() && this.available === null;
    }

    get hoursRequired(): boolean {
        return this.showErrors() && this.available === true && this.selectedSlots.length === 0;
    }

    get hasError(): boolean {
        return this.answerRequired || this.hoursRequired;
    }
}
