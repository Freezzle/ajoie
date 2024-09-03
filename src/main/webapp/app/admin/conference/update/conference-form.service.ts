import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IConference, NewConference} from '../conference.model';
import {Status} from '../../enumerations/status.model';
import {IExhibitor} from '../../exhibitor/exhibitor.model';
import {IStand} from '../../stand/stand.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IConference for edit and NewConferenceFormGroupInput for create.
 */
type ConferenceFormGroupInput = IConference | PartialWithRequiredKeyOf<NewConference>;

type ConferenceFormDefaults = Pick<NewConference, 'id' | 'status'>;

type ConferenceFormGroupContent = {
    id: FormControl<IConference['id'] | NewConference['id']>;
    title: FormControl<IConference['title']>;
    status: FormControl<IConference['status']>;
    extraInformation: FormControl<IConference['extraInformation']>;
    participation: FormControl<IConference['participation']>;
};

export type ConferenceFormGroup = FormGroup<ConferenceFormGroupContent>;

type ConferenceFilterFormGroupContent = {
    fullName: FormControl<IExhibitor['fullName']>;
    status: FormControl<IStand['status']>;
};

export type ConferenceFilterFormGroup = FormGroup<ConferenceFilterFormGroupContent>;

@Injectable({providedIn: 'root'})
export class ConferenceFormService {
    createFilterFormGroup(): ConferenceFilterFormGroup {
        return new FormGroup<ConferenceFilterFormGroupContent>({
            fullName: new FormControl(),
            status: new FormControl('IN_VERIFICATION'),
        });
    }

    createConferenceFormGroup(conference: ConferenceFormGroupInput = {id: null}): ConferenceFormGroup {
        const conferenceRawValue = {
            ...this.getFormDefaults(),
            ...conference,
        };
        return new FormGroup<ConferenceFormGroupContent>({
            id: new FormControl(conferenceRawValue.id),
            title: new FormControl(conferenceRawValue.title, Validators.required),
            status: new FormControl(conferenceRawValue.status, Validators.required),
            extraInformation: new FormControl(conferenceRawValue.extraInformation),
            participation: new FormControl(conferenceRawValue.participation, Validators.required),
        });
    }

    getConference(form: ConferenceFormGroup): IConference | NewConference {
        return form.getRawValue() as IConference | NewConference;
    }

    resetForm(form: ConferenceFormGroup, conference: ConferenceFormGroupInput): void {
        const conferenceRawValue = {...this.getFormDefaults(), ...conference};
        form.reset(
            {
                ...conferenceRawValue,
                id: {value: conferenceRawValue.id, disabled: true},
            } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
        );
    }

    private getFormDefaults(): ConferenceFormDefaults {
        return {
            id: null,
            status: Status.IN_VERIFICATION,
        };
    }
}
