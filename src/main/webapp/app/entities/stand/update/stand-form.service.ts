import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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

type StandFormDefaults = Pick<NewStand, 'id' | 'shared' | 'needElectricity' | 'acceptedChart'>;

type StandFormGroupContent = {
  id: FormControl<IStand['id'] | NewStand['id']>;
  description: FormControl<IStand['description']>;
  nbMeal1: FormControl<IStand['nbMeal1']>;
  nbMeal2: FormControl<IStand['nbMeal2']>;
  nbMeal3: FormControl<IStand['nbMeal3']>;
  shared: FormControl<IStand['shared']>;
  nbTable: FormControl<IStand['nbTable']>;
  nbChair: FormControl<IStand['nbChair']>;
  needElectricity: FormControl<IStand['needElectricity']>;
  acceptedChart: FormControl<IStand['acceptedChart']>;
  exponent: FormControl<IStand['exponent']>;
  salon: FormControl<IStand['salon']>;
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
      description: new FormControl(standRawValue.description),
      nbMeal1: new FormControl(standRawValue.nbMeal1),
      nbMeal2: new FormControl(standRawValue.nbMeal2),
      nbMeal3: new FormControl(standRawValue.nbMeal3),
      shared: new FormControl(standRawValue.shared),
      nbTable: new FormControl(standRawValue.nbTable),
      nbChair: new FormControl(standRawValue.nbChair),
      needElectricity: new FormControl(standRawValue.needElectricity),
      acceptedChart: new FormControl(standRawValue.acceptedChart),
      exponent: new FormControl(standRawValue.exponent),
      salon: new FormControl(standRawValue.salon),
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
      acceptedChart: false,
    };
  }
}
