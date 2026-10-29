import {Component, input} from '@angular/core';
import {FormArray} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {VolunteerDayCardComponent} from '../../volunteer-day-card/volunteer-day-card.component';
import {AvailabilityPreviewComponent, PreviewDay} from '../../availability-preview/availability-preview.component';
import {DayGroup} from '../../volunteer-registration-form.service';
import {FriseSlot, runsToRanges} from '../../volunteer-availability.util';
import {IPublicVolunteerDay} from '../../volunteer-registration.model';
import {dayAbbrev, dayNumber, longDate, shortLabel} from '../../volunteer-day-format.util';

/** Étape 2 — Disponibilités : une carte par jour + aperçu du planning. */
@Component({
               selector: 'app-volunteer-availability-step',
               standalone: true,
               imports: [TranslatePipe, VolunteerDayCardComponent, AvailabilityPreviewComponent],
               templateUrl: './availability-step.component.html'
           })
export class AvailabilityStepComponent {
    readonly availability = input.required<FormArray<DayGroup>>();
    readonly days = input.required<IPublicVolunteerDay[]>();
    readonly slotsByDay = input.required<Record<string, FriseSlot[]>>();
    readonly showErrors = input<boolean>(false);
    readonly volunteerName = input<string>('');

    groupFor(dayId: string): DayGroup | undefined {
        return this.availability().controls.find(c => c.controls.dayId.value === dayId);
    }

    slotsFor(dayId: string): FriseSlot[] {
        return this.slotsByDay()[dayId] ?? [];
    }

    title(day: IPublicVolunteerDay): string {
        return longDate(day.date, day.label);
    }

    abbrev(day: IPublicVolunteerDay): string {
        return dayAbbrev(day.date);
    }

    num(day: IPublicVolunteerDay): string {
        return dayNumber(day.date);
    }

    openingLabel(day: IPublicVolunteerDay): string {
        return `Ouvert de ${this.hour(day.startTime)} à ${this.hour(day.endTime)}.`;
    }

    get previewDays(): PreviewDay[] {
        return this.days().map(day => {
            const group = this.groupFor(day.id);
            const available = group?.controls.available.value ?? null;
            const slots = group?.controls.slots.value ?? [];
            const ranges = available === true ? runsToRanges(this.slotsFor(day.id), slots) : [];
            return {
                id: day.id,
                shortLabel: shortLabel(day.date, day.label),
                startTime: day.startTime,
                endTime: day.endTime,
                state: available === null ? 'unanswered' : available ? 'available' : 'no',
                ranges
            };
        });
    }

    private hour(hhmm: string): string {
        const [h, m] = hhmm.split(':').map(Number);
        return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
    }
}
