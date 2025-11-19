import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IConference} from '../model/conference.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {IWorkshop} from "../../workshop/model/workshop.interface";
import {Status} from "../../enumerations/status.model";

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
        const raw: IConference = {
            ...this.getDefaultConferenceFormValue() as IConference,
            ...(conference ?? {}),
        };

        return new FormGroup<ConferenceFormGroup>({
            id: new FormControl(raw.id),
            title: new FormControl(raw.title, [Validators.required]),
            description: new FormControl(raw.description, [
                Validators.required,
                Validators.maxLength(500),
            ]),
            status: new FormControl(raw.status, Validators.required),
            extraInformation: new FormControl(raw.extraInformation),
            participation: new FormControl(raw.participation, Validators.required),
        });
    }

    getConference(form: FormGroup<ConferenceFormGroup>): IConference {
        return form.getRawValue() as IConference;
    }

    private getDefaultConferenceFormValue(): Pick<IConference, 'status'> {
        return {
            status: Status.IN_VERIFICATION,
        };
    }
}
