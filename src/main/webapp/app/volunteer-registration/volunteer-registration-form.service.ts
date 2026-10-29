import {Injectable} from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';

import {
    buildFriseSlots,
    FriseSlot,
    rangesToIndexes,
    runsToRanges
} from './volunteer-availability.util';
import {
    IPublicVolunteerDay,
    IVolunteerRegistration,
    IVolunteerRegistrationRequest,
    VolunteerZoneMode
} from './volunteer-registration.model';

export type ContactGroup = FormGroup<{
    firstName: FormControl<string | null>;
    lastName: FormControl<string | null>;
    email: FormControl<string | null>;
    phoneNumber: FormControl<string | null>;
}>;

export type DayGroup = FormGroup<{
    dayId: FormControl<string>;
    available: FormControl<boolean | null>;
    slots: FormControl<number[]>;
}>;

export type PreferencesGroup = FormGroup<{
    zoneMode: FormControl<VolunteerZoneMode>;
    categoryIds: FormControl<string[]>;
    notes: FormControl<string | null>;
}>;

export type ConsentsGroup = FormGroup<{
    acceptContact: FormControl<boolean>;
}>;

export type VolunteerRegistrationFormGroup = FormGroup<{
    contact: ContactGroup;
    availability: FormArray<DayGroup>;
    preferences: PreferencesGroup;
    consents: ConsentsGroup;
}>;

/** Un jour doit être réglé : réponse donnée, et si Oui au moins une heure. */
const dayValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const available = group.get('available')?.value;
    const slots = group.get('slots')?.value ?? [];
    if (available === null || available === undefined) {
        return {answerRequired: true};
    }
    if (available === true && slots.length === 0) {
        return {hoursRequired: true};
    }
    return null;
};

/** categoryIds requis seulement si zoneMode === CHOOSE. */
const chooseZonesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const mode = control.parent?.get('zoneMode')?.value;
    const value = control.value ?? [];
    if (mode === 'CHOOSE' && value.length === 0) {
        return {required: true};
    }
    return null;
};

@Injectable({providedIn: 'root'})
export class VolunteerRegistrationFormService {

    createForm(days: IPublicVolunteerDay[]): VolunteerRegistrationFormGroup {
        const availability = new FormArray<DayGroup>(
            days.map(day => this.createDayGroup(day.id))
        );

        const preferences: PreferencesGroup = new FormGroup({
            zoneMode: new FormControl<VolunteerZoneMode>('ANY', {nonNullable: true}),
            categoryIds: new FormControl<string[]>([], {nonNullable: true, validators: chooseZonesValidator}),
            notes: new FormControl<string | null>(null, Validators.maxLength(500))
        });

        // Revalide categoryIds quand le mode de zone change.
        preferences.controls.zoneMode.valueChanges.subscribe(() => {
            preferences.controls.categoryIds.updateValueAndValidity();
        });

        return new FormGroup({
            contact: new FormGroup({
                firstName: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
                lastName: new FormControl<string | null>(null, [Validators.required, Validators.maxLength(255)]),
                email: new FormControl<string | null>(null,
                    [Validators.required, Validators.email, Validators.maxLength(255)]),
                phoneNumber: new FormControl<string | null>(null, Validators.maxLength(255))
            }),
            availability,
            preferences,
            consents: new FormGroup({
                acceptContact: new FormControl<boolean>(false, {nonNullable: true, validators: Validators.requiredTrue})
            })
        });
    }

    createDayGroup(dayId: string): DayGroup {
        return new FormGroup({
            dayId: new FormControl<string>(dayId, {nonNullable: true}),
            available: new FormControl<boolean | null>(null),
            slots: new FormControl<number[]>([], {nonNullable: true})
        }, {validators: dayValidator});
    }

    /** Map dayId -> cases de la frise, pour convertir slots <-> plages horaires. */
    buildSlotsByDay(days: IPublicVolunteerDay[]): Record<string, FriseSlot[]> {
        const map: Record<string, FriseSlot[]> = {};
        for (const day of days) {
            map[day.id] = buildFriseSlots(day.startTime, day.endTime);
        }
        return map;
    }

    toRequest(form: VolunteerRegistrationFormGroup, slotsByDay: Record<string, FriseSlot[]>,
              captchaToken: string | null): IVolunteerRegistrationRequest {
        const raw = form.getRawValue();
        return {
            contact: {
                firstName: (raw.contact.firstName ?? '').trim(),
                lastName: (raw.contact.lastName ?? '').trim(),
                email: (raw.contact.email ?? '').trim(),
                phoneNumber: raw.contact.phoneNumber?.trim() || null
            },
            availability: raw.availability.map(day => {
                const available = day.available === true;
                return {
                    dayId: day.dayId,
                    available,
                    ranges: available ? runsToRanges(slotsByDay[day.dayId] ?? [], day.slots) : []
                };
            }),
            preferences: {
                zoneMode: raw.preferences.zoneMode,
                categoryIds: raw.preferences.zoneMode === 'CHOOSE' ? raw.preferences.categoryIds : [],
                notes: raw.preferences.notes?.trim() || null
            },
            acceptContact: raw.consents.acceptContact,
            captchaToken
        };
    }

    patchFromRegistration(form: VolunteerRegistrationFormGroup, reg: IVolunteerRegistration,
                          slotsByDay: Record<string, FriseSlot[]>): void {
        form.controls.contact.patchValue({
            firstName: reg.contact.firstName,
            lastName: reg.contact.lastName,
            email: reg.contact.email,
            phoneNumber: reg.contact.phoneNumber
        });
        form.controls.preferences.patchValue({
            zoneMode: reg.preferences.zoneMode,
            categoryIds: reg.preferences.categoryIds,
            notes: reg.preferences.notes
        });
        form.controls.consents.patchValue({acceptContact: reg.acceptContact});

        for (const group of form.controls.availability.controls) {
            const dayId = group.controls.dayId.value;
            const day = reg.availability.find(a => a.dayId === dayId);
            if (day) {
                group.patchValue({
                    available: day.available,
                    slots: day.available ? rangesToIndexes(slotsByDay[dayId] ?? [], day.ranges) : []
                });
            }
        }
    }
}
