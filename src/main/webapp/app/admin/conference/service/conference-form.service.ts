import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IConference} from '../model/conference.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';

export type ConferenceFormGroup = {
    id: FormControl<IConference['id'] | null>;
    title: FormControl<IConference['title'] | null>;
    description: FormControl<IConference['description'] | null>;
    status: FormControl<IConference['status'] | null>;
    extraInformation: FormControl<IConference['extraInformation'] | null>;
    participation: FormControl<IConference['participation'] | null>;
};

export type ConferenceFilterFormGroup = {
    fullName: FormControl<IExhibitor['fullName'] | null>;
    status: FormControl<IConference['status'] | null>;
};

@Injectable({providedIn: 'root'})
export class ConferenceFormService {
    createFilterFormGroup(): FormGroup<ConferenceFilterFormGroup> {
        return new FormGroup<ConferenceFilterFormGroup>({
            fullName: new FormControl(null),
            status: new FormControl(null),
        });
    }

    createConferenceFormGroup(conference: IConference | null): FormGroup<ConferenceFormGroup> {
        return new FormGroup<ConferenceFormGroup>({
            id: new FormControl(conference?.id ?? null),
            title: new FormControl(conference?.title ?? null, [Validators.required]),
            description: new FormControl(conference?.description ?? null, [
                Validators.required,
                Validators.maxLength(500),
            ]),
            status: new FormControl(conference?.status ?? null, Validators.required),
            extraInformation: new FormControl(conference?.extraInformation ?? null),
            participation: new FormControl(conference?.participation ?? null, Validators.required),
        });
    }

    getConference(form: FormGroup<ConferenceFormGroup>): IConference {
        return form.getRawValue() as IConference;
    }
}
