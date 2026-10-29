import {FormArray} from '@angular/forms';

import {DayGroup} from './volunteer-registration-form.service';
import {FriseSlot, ITimeRange, runsToRanges} from './volunteer-availability.util';
import {IPublicVolunteerDay} from './volunteer-registration.model';
import {PreviewDay} from './availability-preview/availability-preview.component';
import {longDate, shortLabel} from './volunteer-day-format.util';

/** Plages horaires d'un jour (depuis le FormArray de disponibilités). */
export function rangesForDay(day: IPublicVolunteerDay, availability: FormArray<DayGroup>,
                            slotsByDay: Record<string, FriseSlot[]>): ITimeRange[] {
    const group = availability.controls.find(c => c.controls.dayId.value === day.id);
    if (!group || group.controls.available.value !== true) {
        return [];
    }
    return runsToRanges(slotsByDay[day.id] ?? [], group.controls.slots.value ?? []);
}

/** Construit les lignes de l'aperçu « Votre ligne dans le planning ». */
export function buildPreviewDays(days: IPublicVolunteerDay[], availability: FormArray<DayGroup>,
                                slotsByDay: Record<string, FriseSlot[]>): PreviewDay[] {
    return days.map(day => {
        const group = availability.controls.find(c => c.controls.dayId.value === day.id);
        const available = group?.controls.available.value ?? null;
        return {
            id: day.id,
            shortLabel: shortLabel(day.date, day.label),
            startTime: day.startTime,
            endTime: day.endTime,
            state: available === null ? 'unanswered' : available ? 'available' : 'no',
            ranges: rangesForDay(day, availability, slotsByDay)
        };
    });
}

export interface DaySummaryLine {
    label: string;
    value: string;
}

/** Lignes textuelles du récapitulatif des disponibilités. */
export function buildDaySummaryLines(days: IPublicVolunteerDay[], availability: FormArray<DayGroup>,
                                    slotsByDay: Record<string, FriseSlot[]>, notAvailableText: string): DaySummaryLine[] {
    return days.map(day => {
        const ranges = rangesForDay(day, availability, slotsByDay);
        const group = availability.controls.find(c => c.controls.dayId.value === day.id);
        const available = group?.controls.available.value ?? null;
        const value = available === true && ranges.length
            ? ranges.map(r => `${r.start}–${r.end}`).join(', ')
            : notAvailableText;
        return {label: longDate(day.date, day.label), value};
    });
}
