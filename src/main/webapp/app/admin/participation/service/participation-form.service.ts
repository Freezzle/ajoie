import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { IParticipation, NewParticipation } from '../model/participation.interface';
import { Status } from '../../enumerations/status.model';
import { IExhibitor } from '../../exhibitor/model/exhibitor.interface';
import { CustomValidatorModel } from '../../../shared/field-error/custom-validator.model';

export type ParticipationFormGroup = {
  id: FormControl<IParticipation['id'] | NewParticipation['id']>;
  registrationDate: FormControl<IParticipation['registrationDate'] | string>;
  therapistName: FormControl<IParticipation['therapistName']>;
  nbMeal1: FormControl<IParticipation['nbMeal1']>;
  nbMeal2: FormControl<IParticipation['nbMeal2']>;
  nbMeal3: FormControl<IParticipation['nbMeal3']>;
  acceptedChart: FormControl<IParticipation['acceptedChart']>;
  acceptedContract: FormControl<IParticipation['acceptedContract']>;
  needArrangement: FormControl<IParticipation['needArrangement']>;
  status: FormControl<IParticipation['status']>;
  hasOffer: FormControl<IParticipation['hasOffer']>;
  offer: FormControl<IParticipation['offer']>;
  crushOfHeart: FormControl<IParticipation['crushOfHeart']>;
  guestOfHonor: FormControl<IParticipation['guestOfHonor']>;
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
      status: new FormControl(),
    });
  }

  createParticipationFormGroup(
    participation: IParticipation | NewParticipation = { id: null },
  ): FormGroup<ParticipationFormGroup> {
    const participationRawValue = {
      ...this.getFormDefaults(),
      ...participation,
    };

    return new FormGroup<ParticipationFormGroup>({
      id: new FormControl({ value: participationRawValue.id, disabled: true }),
      registrationDate: new FormControl(
        participationRawValue.registrationDate?.format(DATE_FORMAT),
        Validators.required,
      ),
      therapistName: new FormControl(participationRawValue.therapistName),
      nbMeal1: new FormControl(participationRawValue.nbMeal1, [
        Validators.required,
        CustomValidatorModel.onlyNumbers,
      ]),
      nbMeal2: new FormControl(participationRawValue.nbMeal2, [
        Validators.required,
        CustomValidatorModel.onlyNumbers,
      ]),
      nbMeal3: new FormControl(participationRawValue.nbMeal3, [
        Validators.required,
        CustomValidatorModel.onlyNumbers,
      ]),
      acceptedChart: new FormControl(participationRawValue.acceptedChart),
      acceptedContract: new FormControl(participationRawValue.acceptedContract ?? false),
      needArrangement: new FormControl(participationRawValue.needArrangement ?? false),
      status: new FormControl(participationRawValue.status, Validators.required),
      hasOffer: new FormControl(participationRawValue.hasOffer ?? false),
      offer: new FormControl(participationRawValue.offer),
      crushOfHeart: new FormControl(participationRawValue.crushOfHeart ?? false),
      guestOfHonor: new FormControl(participationRawValue.guestOfHonor ?? false),
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
    'id' | 'registrationDate' | 'acceptedChart' | 'acceptedContract' | 'needArrangement' | 'status'
  > {
    return {
      id: null,
      registrationDate: dayjs(),
      acceptedChart: false,
      acceptedContract: false,
      needArrangement: false,
      status: Status.IN_VERIFICATION,
    };
  }
}
