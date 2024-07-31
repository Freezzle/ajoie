import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { IStand, NewStand } from '../stand.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };
type StandFormGroupInput = IStand | PartialWithRequiredKeyOf<NewStand>;

type FormValueOf<T extends IStand | NewStand> = Omit<T, 'registrationDate'> & {
  registrationDate?: string | null;
};

type StandFormRawValue = FormValueOf<IStand>;

type NewStandFormRawValue = FormValueOf<NewStand>;

type StandFormDefaults = Pick<
  NewStand,
  | 'id'
  | 'shared'
  | 'needElectricity'
  | 'acceptedChart'
  | 'acceptedContract'
  | 'status'
  | 'nbMeal1'
  | 'nbMeal2'
  | 'nbMeal3'
  | 'needArrangment'
  | 'billingClosed'
  | 'nbTable'
  | 'nbChair'
  | 'registrationDate'
>;

type StandFormGroupContent = {
  id: FormControl<StandFormRawValue['id'] | NewStand['id']>;
  description: FormControl<StandFormRawValue['description']>;
  nbMeal1: FormControl<StandFormRawValue['nbMeal1']>;
  nbMeal2: FormControl<StandFormRawValue['nbMeal2']>;
  nbMeal3: FormControl<StandFormRawValue['nbMeal3']>;
  shared: FormControl<StandFormRawValue['shared']>;
  nbTable: FormControl<StandFormRawValue['nbTable']>;
  nbChair: FormControl<StandFormRawValue['nbChair']>;
  needElectricity: FormControl<StandFormRawValue['needElectricity']>;
  acceptedChart: FormControl<StandFormRawValue['acceptedChart']>;
  acceptedContract: FormControl<StandFormRawValue['acceptedContract']>;
  needArrangment: FormControl<StandFormRawValue['needArrangment']>;
  status: FormControl<StandFormRawValue['status']>;
  billingClosed: FormControl<StandFormRawValue['billingClosed']>;
  registrationDate: FormControl<StandFormRawValue['registrationDate']>;
  exponent: FormControl<StandFormRawValue['exponent']>;
  salon: FormControl<StandFormRawValue['salon']>;
  dimension: FormControl<StandFormRawValue['dimension']>;
};

export type StandFormGroup = FormGroup<StandFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class StandFormService {
  createStandFormGroup(stand: StandFormGroupInput = { id: null }): StandFormGroup {
    const standRawValue = this.convertStandToStandRawValue({
      ...this.getFormDefaults(),
      ...stand,
    });
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
      acceptedContract: new FormControl(standRawValue.acceptedContract),
      needArrangment: new FormControl(standRawValue.needArrangment),
      status: new FormControl(standRawValue.status),
      billingClosed: new FormControl(standRawValue.billingClosed),
      registrationDate: new FormControl(standRawValue.registrationDate),
      exponent: new FormControl(standRawValue.exponent),
      salon: new FormControl(standRawValue.salon),
      dimension: new FormControl(standRawValue.dimension),
    });
  }

  getStand(form: StandFormGroup): IStand | NewStand {
    return this.convertStandRawValueToStand(form.getRawValue() as StandFormRawValue | NewStandFormRawValue);
  }

  resetForm(form: StandFormGroup, stand: StandFormGroupInput): void {
    const standRawValue = this.convertStandToStandRawValue({ ...this.getFormDefaults(), ...stand });
    form.reset(
      {
        ...standRawValue,
        id: { value: standRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): StandFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      shared: false,
      nbMeal1: 0,
      nbMeal2: 0,
      nbMeal3: 0,
      nbTable: 0,
      nbChair: 0,
      needElectricity: false,
      acceptedChart: false,
      acceptedContract: false,
      needArrangment: false,
      billingClosed: false,
      status: 'IN_TREATMENT',
      registrationDate: currentTime,
    };
  }

  private convertStandRawValueToStand(rawStand: StandFormRawValue | NewStandFormRawValue): IStand | NewStand {
    return {
      ...rawStand,
      registrationDate: dayjs(rawStand.registrationDate, DATE_FORMAT),
    };
  }

  private convertStandToStandRawValue(
    stand: IStand | (Partial<NewStand> & StandFormDefaults),
  ): StandFormRawValue | PartialWithRequiredKeyOf<NewStandFormRawValue> {
    return {
      ...stand,
      registrationDate: stand.registrationDate ? stand.registrationDate.format(DATE_FORMAT) : undefined,
    };
  }
}
