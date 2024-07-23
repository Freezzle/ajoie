import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { ISalon, NewSalon } from '../salon.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts ISalon for edit and NewSalonFormGroupInput for create.
 */
type SalonFormGroupInput = ISalon | PartialWithRequiredKeyOf<NewSalon>;

/**
 * Type that converts some properties for forms.
 */
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
      place: new FormControl(salonRawValue.place),
      startingDate: new FormControl(salonRawValue.startingDate),
      endingDate: new FormControl(salonRawValue.endingDate),
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
      startingDate: dayjs(rawSalon.startingDate, DATE_TIME_FORMAT),
      endingDate: dayjs(rawSalon.endingDate, DATE_TIME_FORMAT),
    };
  }

  private convertSalonToSalonRawValue(
    salon: ISalon | (Partial<NewSalon> & SalonFormDefaults),
  ): SalonFormRawValue | PartialWithRequiredKeyOf<NewSalonFormRawValue> {
    return {
      ...salon,
      startingDate: salon.startingDate ? salon.startingDate.format(DATE_TIME_FORMAT) : undefined,
      endingDate: salon.endingDate ? salon.endingDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
