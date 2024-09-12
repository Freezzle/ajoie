import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { IParticipation, NewParticipation } from '../participation.model';
import { Status } from '../../enumerations/status.model';
import { IExhibitor } from '../../exhibitor/exhibitor.model';
import { CustomValidatorModel } from '../../../shared/field-error/custom-validator.model';

export type ParticipationFormGroup = {
  id: FormControl<IParticipation['id'] | NewParticipation['id']>;
  registrationDate: FormControl<IParticipation['registrationDate'] | string>;
  nbMeal1: FormControl<IParticipation['nbMeal1']>;
  nbMeal2: FormControl<IParticipation['nbMeal2']>;
  nbMeal3: FormControl<IParticipation['nbMeal3']>;
  acceptedChart: FormControl<IParticipation['acceptedChart']>;
  acceptedContract: FormControl<IParticipation['acceptedContract']>;
  needArrangment: FormControl<IParticipation['needArrangment']>;
  isBillingClosed: FormControl<IParticipation['isBillingClosed']>;
  status: FormControl<IParticipation['status']>;
  offer: FormControl<IParticipation['offer']>;
  additionnalInformation: FormControl<IParticipation['additionnalInformation']>;
  extraInformation: FormControl<IParticipation['extraInformation']>;
  exhibitor: FormControl<IParticipation['exhibitor']>;
  salon: FormControl<IParticipation['salon']>;
};

export type ParticipationFilterFormGroup = {
  fullName: FormControl<IExhibitor['fullName']>;
  status: FormControl<IParticipation['status']>;
};

@Injectable({ providedIn: 'root' })
export class ParticipationFormService {
  createFilterFormGroup(): FormGroup<ParticipationFilterFormGroup> {
    return new FormGroup<ParticipationFilterFormGroup>({
      fullName: new FormControl(),
      status: new FormControl('IN_VERIFICATION'),
    });
  }

  createParticipationFormGroup(participation: IParticipation | NewParticipation = { id: null }): FormGroup<ParticipationFormGroup> {
    const participationRawValue = {
      ...this.getFormDefaults(),
      ...participation,
    };

    return new FormGroup<ParticipationFormGroup>({
      id: new FormControl({ value: participationRawValue.id, disabled: true }),
      registrationDate: new FormControl(participationRawValue.registrationDate?.format(DATE_FORMAT), Validators.required),
      nbMeal1: new FormControl(participationRawValue.nbMeal1, [Validators.required, CustomValidatorModel.onlyNumbers]),
      nbMeal2: new FormControl(participationRawValue.nbMeal2, [Validators.required, CustomValidatorModel.onlyNumbers]),
      nbMeal3: new FormControl(participationRawValue.nbMeal3, [Validators.required, CustomValidatorModel.onlyNumbers]),
      acceptedChart: new FormControl(participationRawValue.acceptedChart, Validators.required),
      acceptedContract: new FormControl(participationRawValue.acceptedContract, Validators.required),
      needArrangment: new FormControl(participationRawValue.needArrangment, Validators.required),
      isBillingClosed: new FormControl(participationRawValue.isBillingClosed, Validators.required),
      status: new FormControl(participationRawValue.status, Validators.required),
      offer: new FormControl(participationRawValue.offer),
      additionnalInformation: new FormControl(participationRawValue.additionnalInformation),
      extraInformation: new FormControl(participationRawValue.extraInformation),
      exhibitor: new FormControl(participationRawValue.exhibitor, Validators.required),
      salon: new FormControl(participationRawValue.salon, Validators.required),
    });
  }

  getParticipation(form: FormGroup<ParticipationFormGroup>): IParticipation | NewParticipation {
    const rawValue = form.getRawValue() as IParticipation | NewParticipation;
    return {
      ...rawValue,
      registrationDate: dayjs(rawValue.registrationDate, DATE_FORMAT),
    };
  }

  private getFormDefaults(): Pick<
    NewParticipation,
    'id' | 'registrationDate' | 'acceptedChart' | 'acceptedContract' | 'needArrangment' | 'isBillingClosed' | 'status'
  > {
    return {
      id: null,
      registrationDate: dayjs(),
      acceptedChart: false,
      acceptedContract: false,
      needArrangment: false,
      isBillingClosed: false,
      status: Status.IN_VERIFICATION,
    };
  }
}
