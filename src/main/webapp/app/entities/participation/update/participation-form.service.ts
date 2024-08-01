import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { IParticipation, NewParticipation } from '../participation.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IParticipation for edit and NewParticipationFormGroupInput for create.
 */
type ParticipationFormGroupInput = IParticipation | PartialWithRequiredKeyOf<NewParticipation>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IParticipation | NewParticipation> = Omit<T, 'registrationDate'> & {
  registrationDate?: string | null;
};

type ParticipationFormRawValue = FormValueOf<IParticipation>;

type NewParticipationFormRawValue = FormValueOf<NewParticipation>;

type ParticipationFormDefaults = Pick<
  NewParticipation,
  'id' | 'registrationDate' | 'acceptedChart' | 'acceptedContract' | 'needArrangment' | 'isBillingClosed'
>;

type ParticipationFormGroupContent = {
  id: FormControl<ParticipationFormRawValue['id'] | NewParticipation['id']>;
  registrationDate: FormControl<ParticipationFormRawValue['registrationDate']>;
  nbMeal1: FormControl<ParticipationFormRawValue['nbMeal1']>;
  nbMeal2: FormControl<ParticipationFormRawValue['nbMeal2']>;
  nbMeal3: FormControl<ParticipationFormRawValue['nbMeal3']>;
  acceptedChart: FormControl<ParticipationFormRawValue['acceptedChart']>;
  acceptedContract: FormControl<ParticipationFormRawValue['acceptedContract']>;
  needArrangment: FormControl<ParticipationFormRawValue['needArrangment']>;
  isBillingClosed: FormControl<ParticipationFormRawValue['isBillingClosed']>;
  status: FormControl<ParticipationFormRawValue['status']>;
  extraInformation: FormControl<ParticipationFormRawValue['extraInformation']>;
  exponent: FormControl<ParticipationFormRawValue['exponent']>;
  salon: FormControl<ParticipationFormRawValue['salon']>;
};

export type ParticipationFormGroup = FormGroup<ParticipationFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ParticipationFormService {
  createParticipationFormGroup(participation: ParticipationFormGroupInput = { id: null }): ParticipationFormGroup {
    const participationRawValue = this.convertParticipationToParticipationRawValue({
      ...this.getFormDefaults(),
      ...participation,
    });
    return new FormGroup<ParticipationFormGroupContent>({
      id: new FormControl(
        { value: participationRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      registrationDate: new FormControl(participationRawValue.registrationDate),
      nbMeal1: new FormControl(participationRawValue.nbMeal1),
      nbMeal2: new FormControl(participationRawValue.nbMeal2),
      nbMeal3: new FormControl(participationRawValue.nbMeal3),
      acceptedChart: new FormControl(participationRawValue.acceptedChart),
      acceptedContract: new FormControl(participationRawValue.acceptedContract),
      needArrangment: new FormControl(participationRawValue.needArrangment),
      isBillingClosed: new FormControl(participationRawValue.isBillingClosed),
      status: new FormControl(participationRawValue.status),
      extraInformation: new FormControl(participationRawValue.extraInformation),
      exponent: new FormControl(participationRawValue.exponent),
      salon: new FormControl(participationRawValue.salon),
    });
  }

  getParticipation(form: ParticipationFormGroup): IParticipation | NewParticipation {
    return this.convertParticipationRawValueToParticipation(form.getRawValue() as ParticipationFormRawValue | NewParticipationFormRawValue);
  }

  resetForm(form: ParticipationFormGroup, participation: ParticipationFormGroupInput): void {
    const participationRawValue = this.convertParticipationToParticipationRawValue({ ...this.getFormDefaults(), ...participation });
    form.reset(
      {
        ...participationRawValue,
        id: { value: participationRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ParticipationFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      registrationDate: currentTime,
      acceptedChart: false,
      acceptedContract: false,
      needArrangment: false,
      isBillingClosed: false,
    };
  }

  private convertParticipationRawValueToParticipation(
    rawParticipation: ParticipationFormRawValue | NewParticipationFormRawValue,
  ): IParticipation | NewParticipation {
    return {
      ...rawParticipation,
      registrationDate: dayjs(rawParticipation.registrationDate, DATE_FORMAT),
    };
  }

  private convertParticipationToParticipationRawValue(
    participation: IParticipation | (Partial<NewParticipation> & ParticipationFormDefaults),
  ): ParticipationFormRawValue | PartialWithRequiredKeyOf<NewParticipationFormRawValue> {
    return {
      ...participation,
      registrationDate: participation.registrationDate ? participation.registrationDate.format(DATE_FORMAT) : undefined,
    };
  }
}
