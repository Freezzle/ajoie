import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { IPriceStandSalon, ISalon, NewPriceStandSalon, NewSalon } from '../salon.model';

export type PriceStandGroup = {
  id: FormControl<IPriceStandSalon['id'] | NewPriceStandSalon['id']>;
  price: FormControl<IPriceStandSalon['price']>;
  dimension: FormControl<IPriceStandSalon['dimension']>;
};

export type SalonFormGroup = {
  id: FormControl<ISalon['id'] | NewSalon['id']>;
  referenceNumber: FormControl<ISalon['referenceNumber']>;
  place: FormControl<ISalon['place']>;
  startingDate: FormControl<ISalon['startingDate'] | string>;
  endingDate: FormControl<ISalon['endingDate'] | string>;
  priceMeal1: FormControl<ISalon['priceMeal1']>;
  priceMeal2: FormControl<ISalon['priceMeal2']>;
  priceMeal3: FormControl<ISalon['priceMeal3']>;
  priceConference: FormControl<ISalon['priceConference']>;
  priceSharingStand: FormControl<ISalon['priceSharingStand']>;
  priceStandSalons: FormArray<FormGroup<PriceStandGroup>>;
  extraInformation: FormControl<ISalon['extraInformation']>;
};

@Injectable({ providedIn: 'root' })
export class SalonFormService {
  createSalonFormGroup(salon: ISalon | NewSalon): FormGroup<SalonFormGroup> {
    const salonRawValue = {
      ...this.getFormDefaults(),
      ...salon,
    } as ISalon;

    return new FormGroup<SalonFormGroup>({
      id: new FormControl(salonRawValue.id),
      place: new FormControl(salonRawValue.place, {
        validators: [Validators.required, Validators.minLength(5), Validators.maxLength(50)],
      }),
      referenceNumber: new FormControl(salonRawValue.referenceNumber, {
        validators: [Validators.required, Validators.maxLength(10)],
      }),
      startingDate: new FormControl(salonRawValue.startingDate?.format(DATE_FORMAT), {
        validators: [Validators.required],
      }),
      endingDate: new FormControl(salonRawValue.endingDate?.format(DATE_FORMAT), {
        validators: [Validators.required],
      }),
      priceMeal1: new FormControl(salonRawValue.priceMeal1),
      priceMeal2: new FormControl(salonRawValue.priceMeal2),
      priceMeal3: new FormControl(salonRawValue.priceMeal3),
      priceConference: new FormControl(salonRawValue.priceConference),
      priceSharingStand: new FormControl(salonRawValue.priceSharingStand),
      priceStandSalons: new FormArray<FormGroup<PriceStandGroup>>(
        salonRawValue.priceStandSalons
        ? salonRawValue.priceStandSalons.map(
          priceStand =>
            new FormGroup<PriceStandGroup>({
              id: new FormControl(priceStand.id),
              price: new FormControl(priceStand.price),
              dimension: new FormControl(priceStand.dimension),
            }),
        )
        : ([] as FormGroup<PriceStandGroup>[]),
      ),
      extraInformation: new FormControl(salonRawValue.extraInformation),
    });
  }

  getSalon(form: FormGroup<SalonFormGroup>): ISalon | NewSalon {
    const rawValue = form.getRawValue() as ISalon | NewSalon;
    return {
      ...rawValue,
      startingDate: dayjs(rawValue.startingDate, DATE_FORMAT),
      endingDate: dayjs(rawValue.endingDate, DATE_FORMAT),
    };
  }

  private getFormDefaults(): Pick<NewSalon, 'id' | 'startingDate' | 'endingDate'> {
    const currentTime = dayjs();

    return {
      id: null,
      startingDate: currentTime,
      endingDate: currentTime,
    };
  }
}
