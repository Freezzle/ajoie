import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { IStand, NewStand } from '../stand.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IStand for edit and NewStandFormGroupInput for create.
 */
type StandFormGroupInput = IStand | PartialWithRequiredKeyOf<NewStand>;

type StandFormDefaults = Pick<NewStand, 'id' | 'shared' | 'needElectricity'>;

type StandFormGroupContent = {
  id: FormControl<IStand['id'] | NewStand['id']>;
  description: FormControl<IStand['description']>;
  website: FormControl<IStand['website']>;
  socialMedia: FormControl<IStand['socialMedia']>;
  urlPicture: FormControl<IStand['urlPicture']>;
  shared: FormControl<IStand['shared']>;
  nbTable: FormControl<IStand['nbTable']>;
  nbChair: FormControl<IStand['nbChair']>;
  needElectricity: FormControl<IStand['needElectricity']>;
  status: FormControl<IStand['status']>;
  extraInformation: FormControl<IStand['extraInformation']>;
  participation: FormControl<IStand['participation']>;
  dimension: FormControl<IStand['dimension']>;
};

export type StandFormGroup = FormGroup<StandFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class StandFormService {
  createStandFormGroup(stand: StandFormGroupInput = { id: null }): StandFormGroup {
    const standRawValue = {
      ...this.getFormDefaults(),
      ...stand,
    };
    return new FormGroup<StandFormGroupContent>({
      id: new FormControl(
        { value: standRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      description: new FormControl(standRawValue.description, {
        validators: [Validators.required],
      }),
      website: new FormControl(standRawValue.website),
      socialMedia: new FormControl(standRawValue.socialMedia),
      urlPicture: new FormControl(standRawValue.urlPicture),
      shared: new FormControl(standRawValue.shared),
      nbTable: new FormControl(standRawValue.nbTable),
      nbChair: new FormControl(standRawValue.nbChair),
      needElectricity: new FormControl(standRawValue.needElectricity),
      status: new FormControl(standRawValue.status),
      extraInformation: new FormControl(standRawValue.extraInformation),
      participation: new FormControl(standRawValue.participation),
      dimension: new FormControl(standRawValue.dimension),
    });
  }

  getStand(form: StandFormGroup): IStand | NewStand {
    return form.getRawValue() as IStand | NewStand;
  }

  resetForm(form: StandFormGroup, stand: StandFormGroupInput): void {
    const standRawValue = { ...this.getFormDefaults(), ...stand };
    form.reset(
      {
        ...standRawValue,
        id: { value: standRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): StandFormDefaults {
    return {
      id: null,
      shared: false,
      needElectricity: false,
    };
  }
}
