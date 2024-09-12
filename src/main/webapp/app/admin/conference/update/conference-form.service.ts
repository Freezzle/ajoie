import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IConference, NewConference } from '../conference.model';
import { Status } from '../../enumerations/status.model';
import { IExhibitor } from '../../exhibitor/exhibitor.model';

export type ConferenceFormGroup = {
  id: FormControl<IConference['id'] | NewConference['id']>;
  title: FormControl<IConference['title']>;
  description: FormControl<IConference['description']>;
  status: FormControl<IConference['status']>;
  extraInformation: FormControl<IConference['extraInformation']>;
  participation: FormControl<IConference['participation']>;
};

export type ConferenceFilterFormGroup = {
  fullName: FormControl<IExhibitor['fullName']>;
  status: FormControl<IConference['status']>;
};

@Injectable({ providedIn: 'root' })
export class ConferenceFormService {
  createFilterFormGroup(): FormGroup<ConferenceFilterFormGroup> {
    return new FormGroup<ConferenceFilterFormGroup>({
      fullName: new FormControl(null),
      status: new FormControl('IN_VERIFICATION'),
    });
  }

  createConferenceFormGroup(conference: IConference | NewConference): FormGroup<ConferenceFormGroup> {
    const conferenceRawValue = {
      ...this.getFormDefaults(),
      ...conference,
    };
    return new FormGroup<ConferenceFormGroup>({
      id: new FormControl(conferenceRawValue.id),
      title: new FormControl(conferenceRawValue.title, [Validators.required]),
      description: new FormControl(conferenceRawValue.description, [Validators.required, Validators.maxLength(500)]),
      status: new FormControl(conferenceRawValue.status, Validators.required),
      extraInformation: new FormControl(conferenceRawValue.extraInformation),
      participation: new FormControl(conferenceRawValue.participation, Validators.required),
    });
  }

  getConference(form: FormGroup<ConferenceFormGroup>): IConference | NewConference {
    return form.getRawValue() as IConference | NewConference;
  }

  private getFormDefaults(): Pick<NewConference, 'id' | 'status'> {
    return {
      id: null,
      status: Status.IN_VERIFICATION,
    };
  }
}
