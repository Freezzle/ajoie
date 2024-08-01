import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ISalon, NewSalon } from '../salon.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };
type SalonFormGroupInput = ISalon | PartialWithRequiredKeyOf<NewSalon>;

type FormValueOf<T extends ISalon | NewSalon> = Omit<T, 'startingDate' | 'endingDate'> & {
  startingDate?: string | null;
  endingDate?: string | null;
};

type SalonFormRawValue = FormValueOf<ISalon>;

type NewSalonFormRawValue = FormValueOf<NewSalon>;

type SalonFormDefaults = Pick<NewSalon, 'id' | 'startingDate' | 'endingDate'>;

type SalonFormGroupContent = {
  id: FormControl<SalonFormRawValue['id'] | NewSalon['id']>;
  place: FormControl<SalonFormRawValue['place']>;
  startingDate: FormControl<SalonFormRawValue['startingDate']>;
  endingDate: FormControl<SalonFormRawValue['endingDate']>;
  priceMeal1: FormControl<SalonFormRawValue['priceMeal1']>;
  priceMeal2: FormControl<SalonFormRawValue['priceMeal2']>;
  priceMeal3: FormControl<SalonFormRawValue['priceMeal3']>;
  priceConference: FormControl<SalonFormRawValue['priceConference']>;
  priceSharingStand: FormControl<SalonFormRawValue['priceSharingStand']>;
  extraInformation: FormControl<SalonFormRawValue['extraInformation']>;
};

export type SalonFormGroup = FormGroup<SalonFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class SalonFormService {
  createSalonFormGroup(salon: SalonFormGroupInput = { id: null }): SalonFormGroup {
    const salonRawValue = this.convertSalonToSalonRawValue({
      ...this.getFormDefaults(),
      ...salon,
    });
    return new FormGroup<SalonFormGroupContent>({
      id: new FormControl(
        { value: salonRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      place: new FormControl(salonRawValue.place, {
        validators: [Validators.required],
      }),
      startingDate: new FormControl(salonRawValue.startingDate, {
        validators: [Validators.required],
      }),
      endingDate: new FormControl(salonRawValue.endingDate, {
        validators: [Validators.required],
      }),
      priceMeal1: new FormControl(salonRawValue.priceMeal1),
      priceMeal2: new FormControl(salonRawValue.priceMeal2),
      priceMeal3: new FormControl(salonRawValue.priceMeal3),
      priceConference: new FormControl(salonRawValue.priceConference),
      priceSharingStand: new FormControl(salonRawValue.priceSharingStand),
      extraInformation: new FormControl(salonRawValue.extraInformation),
    });
  }

  getSalon(form: SalonFormGroup): ISalon | NewSalon {
    return this.convertSalonRawValueToSalon(form.getRawValue() as SalonFormRawValue | NewSalonFormRawValue);
  }

  resetForm(form: SalonFormGroup, salon: SalonFormGroupInput): void {
    const salonRawValue = this.convertSalonToSalonRawValue({ ...this.getFormDefaults(), ...salon });
    form.reset(
      {
        ...salonRawValue,
        id: { value: salonRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): SalonFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      startingDate: currentTime,
      endingDate: currentTime,
    };
  }

  private convertSalonRawValueToSalon(rawSalon: SalonFormRawValue | NewSalonFormRawValue): ISalon | NewSalon {
    return {
      ...rawSalon,
      startingDate: dayjs(rawSalon.startingDate, DATE_FORMAT),
      endingDate: dayjs(rawSalon.endingDate, DATE_FORMAT),
    };
  }

  private convertSalonToSalonRawValue(
    salon: ISalon | (Partial<NewSalon> & SalonFormDefaults),
  ): SalonFormRawValue | PartialWithRequiredKeyOf<NewSalonFormRawValue> {
    return {
      ...salon,
      startingDate: salon.startingDate ? salon.startingDate.format(DATE_FORMAT) : undefined,
      endingDate: salon.endingDate ? salon.endingDate.format(DATE_FORMAT) : undefined,
    };
  }
}
